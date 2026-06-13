import WidgetKit
import SwiftUI

// MARK: - Configuración compartida

private enum Shared {
    static let appGroup = "group.com.nakama.ahora"
    static let snapshotKey = "ahora.snapshot"
    static let deepLink = URL(string: "ahora://abrir")!
    static let maxRows = 4 // filas que caben en systemMedium sin recortar
}

// MARK: - Modelo (coincide con WidgetTask del lado JS)

struct WidgetTask: Codable {
    let title: String
    let dueAt: Double? // epoch ms, null = sin fecha
    let priority: String // "alta" | "media" | "baja"
    let done: Bool

    var dueDate: Date? {
        guard let dueAt else { return nil }
        return Date(timeIntervalSince1970: dueAt / 1000)
    }
}

// MARK: - Lectura del App Group

private func loadTasks() -> [WidgetTask] {
    guard
        let defaults = UserDefaults(suiteName: Shared.appGroup),
        let json = defaults.string(forKey: Shared.snapshotKey),
        let data = json.data(using: .utf8),
        let tasks = try? JSONDecoder().decode([WidgetTask].self, from: data)
    else {
        return []
    }
    return tasks
}

// MARK: - Timeline

struct AhoraEntry: TimelineEntry {
    let date: Date
    let tasks: [WidgetTask]
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> AhoraEntry {
        AhoraEntry(date: Date(), tasks: [])
    }

    func getSnapshot(in context: Context, completion: @escaping (AhoraEntry) -> Void) {
        completion(AhoraEntry(date: Date(), tasks: loadTasks()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AhoraEntry>) -> Void) {
        let entry = AhoraEntry(date: Date(), tasks: loadTasks())
        // Refresca al menos cada hora; la app fuerza reloadAllTimelines al cambiar.
        let nextRefresh = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
    }
}

// MARK: - Formato de fechas (es-ES, coherente con la app)

private enum Fmt {
    static let daysShort = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
    static let monthsShort = ["ene", "feb", "mar", "abr", "may", "jun",
                              "jul", "ago", "sep", "oct", "nov", "dic"]

    static func two(_ n: Int) -> String { n < 10 ? "0\(n)" : "\(n)" }

    static func headerDate(_ now: Date) -> String {
        let c = Calendar.current
        let wd = c.component(.weekday, from: now) - 1
        let d = c.component(.day, from: now)
        let m = c.component(.month, from: now) - 1
        return "\(daysShort[wd]) \(d) \(monthsShort[m])"
    }

    static func time(_ date: Date) -> String {
        let c = Calendar.current
        return "\(two(c.component(.hour, from: date))):\(two(c.component(.minute, from: date)))"
    }

    /// Etiqueta corta para la fila: "Hoy 10:00", "Mañana", "vie", "13 jun".
    static func short(_ date: Date, now: Date) -> String {
        let c = Calendar.current
        let days = c.dateComponents([.day], from: c.startOfDay(for: now),
                                    to: c.startOfDay(for: date)).day ?? 0
        switch days {
        case 0: return "Hoy \(time(date))"
        case 1: return "Mañana"
        case -1: return "Ayer"
        case 2...6:
            return daysShort[c.component(.weekday, from: date) - 1]
        default:
            let d = c.component(.day, from: date)
            let m = c.component(.month, from: date) - 1
            return "\(d) \(monthsShort[m])"
        }
    }
}

// MARK: - Estilo

private enum Palette {
    static let bg = Color(red: 0.055, green: 0.059, blue: 0.075)
    static let text = Color(red: 0.91, green: 0.92, blue: 0.94)
    static let muted = Color(red: 0.60, green: 0.63, blue: 0.68)
    static let accent = Color(red: 0.431, green: 0.659, blue: 0.996)
    static let danger = Color(red: 1.0, green: 0.42, blue: 0.42)

    static func dot(_ priority: String) -> Color {
        switch priority {
        case "alta": return danger
        case "baja": return Color(red: 0.43, green: 0.91, blue: 0.66)
        default: return Color(red: 0.96, green: 0.77, blue: 0.32)
        }
    }
}

// MARK: - Vista

struct AhoraWidgetEntryView: View {
    var entry: AhoraEntry

    private var overdueCount: Int {
        let now = entry.date
        return entry.tasks.filter { ($0.dueDate.map { $0 < now }) ?? false }.count
    }

    var body: some View {
        let rows = Array(entry.tasks.prefix(Shared.maxRows))

        VStack(alignment: .leading, spacing: 8) {
            header
            if rows.isEmpty {
                Spacer()
                Text("Sin tareas próximas")
                    .font(.system(size: 14))
                    .foregroundColor(Palette.muted)
                    .frame(maxWidth: .infinity, alignment: .center)
                Spacer()
            } else {
                ForEach(rows.indices, id: \.self) { i in
                    row(rows[i])
                }
                Spacer(minLength: 0)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Palette.bg)
        .widgetURL(Shared.deepLink) // toda la superficie abre la app
    }

    private var header: some View {
        HStack {
            Text(Fmt.headerDate(entry.date).capitalized)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(Palette.text)
            Spacer()
            if overdueCount > 0 {
                Text("\(overdueCount) atrasada\(overdueCount == 1 ? "" : "s")")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(Palette.danger)
            }
        }
    }

    private func row(_ task: WidgetTask) -> some View {
        let now = entry.date
        let overdue = (task.dueDate.map { $0 < now }) ?? false
        return HStack(spacing: 8) {
            Circle()
                .fill(Palette.dot(task.priority))
                .frame(width: 7, height: 7)
            Text(task.title)
                .font(.system(size: 13))
                .foregroundColor(Palette.text)
                .lineLimit(1)
            Spacer(minLength: 6)
            if let due = task.dueDate {
                Text(Fmt.short(due, now: now))
                    .font(.system(size: 12))
                    .foregroundColor(overdue ? Palette.danger : Palette.muted)
                    .lineLimit(1)
            }
        }
    }
}

// MARK: - Widget

@main
struct AhoraWidget: Widget {
    let kind = "AhoraWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            if #available(iOS 17.0, *) {
                AhoraWidgetEntryView(entry: entry)
                    .containerBackground(Palette.bg, for: .widget)
            } else {
                AhoraWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("Ahora")
        .description("Tus próximas tareas de un vistazo.")
        .supportedFamilies([.systemMedium])
    }
}
