export type Locale = 'en' | 'es';

export const translations = {
    en: {
        // Settings Modal
        'settings.title': 'Profile',
        'settings.email': 'Email',
        'settings.noEmail': 'No email',
        'settings.name': 'Name',
        'settings.logout': 'log out',
        'settings.back': 'back',
        'settings.language': 'Language',

        // App Navigation & Tabs
        'app.tab.today': 'Today',
        'app.tab.index': '100D',
        'app.tab.settings': 'Settings',

        // Days
        'day.sun': 'sun',
        'day.mon': 'mon',
        'day.tue': 'tue',
        'day.wed': 'wed',
        'day.thu': 'thu',
        'day.fri': 'fri',
        'day.sat': 'sat',

        // Main App Messages
        'app.loadingError': 'error loading data',
        'app.emptyHabit': 'create a habit in the Settings tab',
        'app.registered': 'registered',
        'app.deleted': 'deleted',
        'app.habitEdited': 'habit edited',
        'app.habitCreated': 'habit created',
        'app.habitDeleted': 'habit deleted',

        // Index View
        'index.title': '100D Index',
        'index.philosophy': 'The index is a mirror. It reflects how you are with your habits over the last 100 real days — no goals, no pressure.',
        'index.daysRegistered': 'days registered',
        'index.dayRegistered': 'day registered',
        'index.noData': 'no data',
        'index.current': 'current index',
        'index.evolutionLabel': 'INDEX EVOLUTION · LAST 100 DAYS',
        'index.recordsLabel': 'RECORDS · LAST 100 DAYS',
        'index.noRecords': 'no records in the last 100 days',
        'index.target': 'target',
        'index.back': '← back',

        // Configure View
        'config.title': 'Active habits',
        'config.profile': 'Profile',
        'config.edit': 'edit',
        'config.delete': 'delete',
        'config.newHabit': '+ new habit',
        'habit.days': 'DAYS',
    },
    es: {
        // Settings Modal
        'settings.title': 'Perfil',
        'settings.email': 'Email',
        'settings.noEmail': 'Sin email',
        'settings.name': 'Nombre',
        'settings.logout': 'cerrar sesión',
        'settings.back': 'volver',
        'settings.language': 'Idioma',

        // App Navigation & Tabs
        'app.tab.today': 'Hoy',
        'app.tab.index': '100D',
        'app.tab.settings': 'Ajustes',

        // Days
        'day.sun': 'dom',
        'day.mon': 'lun',
        'day.tue': 'mar',
        'day.wed': 'mié',
        'day.thu': 'jue',
        'day.fri': 'vie',
        'day.sat': 'sáb',

        // Main App Messages
        'app.loadingError': 'error cargando datos',
        'app.emptyHabit': 'creá un hábito en la pestaña Ajustes',
        'app.registered': 'registrado',
        'app.deleted': 'eliminado',
        'app.habitEdited': 'hábito editado',
        'app.habitCreated': 'hábito creado',
        'app.habitDeleted': 'hábito eliminado',

        // Index View
        'index.title': 'Índice 100D',
        'index.philosophy': 'El índice es un espejo. Refleja cómo sos con tus hábitos en los últimos 100 días reales — sin metas, sin presión.',
        'index.daysRegistered': 'días registrados',
        'index.dayRegistered': 'día registrado',
        'index.noData': 'sin datos',
        'index.current': 'índice actual',
        'index.evolutionLabel': 'EVOLUCIÓN DEL ÍNDICE · ÚLTIMOS 100 DÍAS',
        'index.recordsLabel': 'REGISTROS · ÚLTIMOS 100 DÍAS',
        'index.noRecords': 'sin registros en los últimos 100 días',
        'index.target': 'objetivo',
        'index.back': '← volver',

        // Configure View
        'config.title': 'Hábitos activos',
        'config.profile': 'Perfil',
        'config.edit': 'editar',
        'config.delete': 'eliminar',
        'config.newHabit': '+ nuevo hábito',
        'habit.days': 'DÍAS',
    }
};

export type TranslationKey = keyof typeof translations.en;
