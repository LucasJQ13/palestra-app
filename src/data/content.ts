export const news = [
  {
    scope: 'Nacional',
    title: 'Bienvenida a Palestra',
    body: 'Un espacio comun para mantener conectadas a las comunidades y cuidar la comunicacion interna.',
    imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
  },
  {
    scope: 'Formacion',
    title: 'Materiales iniciales disponibles',
    body: 'La biblioteca crecera con documentos, oraciones, canciones y recursos para coordinadores. Este aviso sirve para probar un texto mediano, con suficiente contenido como para ocupar varias lineas y permitir que la tarjeta se expanda sin romper el diseno.',
    imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
  },
  {
    scope: 'Servicio',
    title: 'Convocatoria nacional de comunidades',
    body: 'Este es un aviso largo de prueba. La idea es validar como se comporta la app cuando un equipo nacional, provincial o local necesita publicar un comunicado con bastante informacion. En una version real podria incluir indicaciones pastorales, horarios, responsables, datos de inscripcion, materiales previos y una breve motivacion para que los jovenes puedan prepararse. Tambien nos permite revisar si el texto se lee bien, si la imagen acompana sin ocupar demasiado espacio y si la experiencia de expandir o contraer resulta comoda en celulares de distintos tamanos.',
    imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
  }
];

export const agenda = [
  {
    province: 'Salta',
    date: 'Mayo 2026',
    title: 'Encuentro comunitario',
    description: 'Actividad abierta para jovenes interesados en conocer el movimiento.',
    visibility: 'publico'
  },
  {
    province: 'Cordoba',
    date: 'Junio 2026',
    title: 'Reunion de coordinadores',
    description: 'Espacio interno para revisar agenda, servicios y prioridades pastorales.',
    visibility: 'privado'
  }
];

export const notilestra = [
  {
    scope: 'Noticia',
    date: '2026-05-18',
    title: 'Palestra prepara su agenda nacional',
    body: 'Equipos de distintas provincias comienzan a ordenar encuentros, reuniones y actividades para fortalecer la comunicacion nacional.'
  },
  {
    scope: 'Novedad',
    date: '2026-05-22',
    title: 'Nuevo espacio de materiales internos',
    body: 'La app incorporara recursos para miembros aprobados, coordinadores, asesores y equipo nacional.'
  },
  {
    scope: 'Agenda',
    date: '2026-05-28',
    title: 'Lanzamiento de prueba',
    body: 'Fecha objetivo para presentar una primera version instalable por APK y comenzar pruebas con comunidades.'
  }
];

export const calendarActivities = [
  {
    date: '2026-05-16',
    title: 'Encuentro joven regional',
    type: 'image-text',
    body: 'Jornada ficticia de encuentro, oracion y actividades por grupos para comunidades cercanas.',
    imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
  },
  {
    date: '2026-05-21',
    title: 'Reunion de coordinadores',
    type: 'text',
    body: 'Actividad ficticia reservada para ordenar agenda, materiales y acompanamiento comunitario.'
  },
  {
    date: '2026-05-25',
    title: 'Celebracion patria comunitaria',
    type: 'image',
    imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
  },
  {
    date: '2026-06-04',
    title: 'Taller de formacion',
    type: 'image-text',
    body: 'Espacio ficticio de formacion para nuevos servidores y referentes locales.',
    imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
  },
  {
    date: '2026-06-13',
    title: 'Mision comunitaria',
    type: 'text',
    body: 'Salida ficticia de servicio y visita comunitaria.'
  },
  {
    date: '2026-06-20',
    title: 'Fecha privada de sedimentadores',
    type: 'text',
    body: 'Actividad ficticia visible solo para sedimentadores y rangos dirigenciales.',
    requiredPermission: 'ver_fechas_privadas'
  }
];

export const materials = [
  {
    type: 'Publico',
    title: 'Oracion inicial',
    description: 'Recurso abierto para acompanar encuentros y reuniones.',
    permission: null
  },
  {
    type: 'Interno',
    title: 'Guia para reuniones',
    description: 'Documento reservado para miembros aprobados.',
    permission: 'ver_materiales_internos'
  },
  {
    type: 'Reservado',
    title: 'Documento de coordinacion nacional',
    description: 'Material de trabajo para equipo nacional y roles autorizados.',
    permission: 'descargar_archivos_exclusivos'
  }
] as const;

type CommunityLocation = {
  id?: string;
  name: string;
  address: string;
  phone: string;
  meetingDay: string;
  meetingTime: string;
  description: string;
  imageUrl: string;
  group?: 'jovenes' | 'adultos';
};

type ProvinceCommunity = {
  province: string;
  region: string;
  description: string;
  locations: CommunityLocation[];
};

export const communities: ProvinceCommunity[] = [
  {
    province: 'Salta',
    region: 'NOA',
    description: '29 comunidades activas.',
    locations: Array.from({ length: 29 }, (_, index) => ({
      name: `Comunidad Salta ${index + 1}`,
      address: `Direccion ficticia ${index + 1}, Salta`,
      phone: `+54 387 400-${String(index + 1).padStart(4, '0')}`,
      meetingDay: index % 2 === 0 ? 'Sabado' : 'Domingo',
      meetingTime: index % 2 === 0 ? '18:00' : '17:30',
      description: `Presentacion ficticia de Comunidad Salta ${index + 1}. Nacio como espacio de encuentro, servicio y formacion para jovenes de la zona.`,
      imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
    }))
  },
  {
    province: 'Jujuy',
    region: 'NOA',
    description: '25 comunidades activas.',
    locations: Array.from({ length: 25 }, (_, index) => ({
      name: `Comunidad Jujuy ${index + 1}`,
      address: `Direccion ficticia ${index + 1}, Jujuy`,
      phone: `+54 388 400-${String(index + 1).padStart(4, '0')}`,
      meetingDay: index % 2 === 0 ? 'Viernes' : 'Sabado',
      meetingTime: index % 2 === 0 ? '20:00' : '18:30',
      description: `Historia ficticia de Comunidad Jujuy ${index + 1}, una comunidad joven que acompana procesos de fe, amistad y compromiso.`,
      imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
    }))
  },
  {
    province: 'Tucuman',
    region: 'NOA',
    description: '19 comunidades activas.',
    locations: [
      ...Array.from({ length: 16 }, (_, index) => ({
      name: `Comunidad Tucuman ${index + 1}`,
      address: `Direccion ficticia ${index + 1}, Tucuman`,
      phone: `+54 381 400-${String(index + 1).padStart(4, '0')}`,
      meetingDay: index % 2 === 0 ? 'Sabado' : 'Miercoles',
      meetingTime: index % 2 === 0 ? '19:00' : '21:00',
      description: `Comunidad Tucuman ${index + 1} conserva una historia ficticia de encuentros, misiones y crecimiento comunitario.`,
      imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png',
      group: 'jovenes'
    })),
      ...Array.from({ length: 3 }, (_, index) => ({
        name: `Comunidad Adultos Tucuman ${index + 1}`,
        address: `Direccion ficticia adultos ${index + 1}, Tucuman`,
        phone: `+54 381 500-${String(index + 1).padStart(4, '0')}`,
        meetingDay: 'Jueves',
        meetingTime: '20:30',
        description: `Comunidad adulta ficticia de Tucuman ${index + 1}, pensada para acompanamiento, servicio y memoria comunitaria.`,
        imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png',
        group: 'adultos'
      }))
    ]
  },
  {
    province: 'Catamarca',
    region: 'NOA',
    description: '20 comunidades activas.',
    locations: [
      ...Array.from({ length: 17 }, (_, index) => ({
      name: `Comunidad Catamarca ${index + 1}`,
      address: `Direccion ficticia ${index + 1}, Catamarca`,
      phone: `+54 383 400-${String(index + 1).padStart(4, '0')}`,
      meetingDay: index % 2 === 0 ? 'Domingo' : 'Sabado',
      meetingTime: index % 2 === 0 ? '18:00' : '20:00',
      description: `Breve presentacion ficticia de Comunidad Catamarca ${index + 1}, con una identidad marcada por la oracion y el servicio.`,
      imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png',
      group: 'jovenes'
    })),
      ...Array.from({ length: 3 }, (_, index) => ({
        name: `Comunidad Adultos Catamarca ${index + 1}`,
        address: `Direccion ficticia adultos ${index + 1}, Catamarca`,
        phone: `+54 383 500-${String(index + 1).padStart(4, '0')}`,
        meetingDay: 'Martes',
        meetingTime: '20:00',
        description: `Comunidad adulta ficticia de Catamarca ${index + 1}, nacida para sostener procesos de fe y servicio.`,
        imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png',
        group: 'adultos'
      }))
    ]
  },
  {
    province: 'Cordoba',
    region: 'Centro',
    description: '2 comunidades activas.',
    locations: Array.from({ length: 2 }, (_, index) => ({
      name: `Comunidad Cordoba ${index + 1}`,
      address: `Direccion ficticia ${index + 1}, Cordoba`,
      phone: `+54 351 400-${String(index + 1).padStart(4, '0')}`,
      meetingDay: 'Sabado',
      meetingTime: '18:30',
      description: `Comunidad Cordoba ${index + 1} se presenta como una comunidad ficticia de camino, amistad y compromiso evangelizador.`,
      imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
    }))
  },
  {
    province: 'San Luis',
    region: 'Cuyo',
    description: '3 comunidades activas.',
    locations: Array.from({ length: 3 }, (_, index) => ({
      name: `Comunidad San Luis ${index + 1}`,
      address: `Direccion ficticia ${index + 1}, San Luis`,
      phone: `+54 266 400-${String(index + 1).padStart(4, '0')}`,
      meetingDay: 'Viernes',
      meetingTime: '20:30',
      description: `Comunidad San Luis ${index + 1} tiene una historia ficticia de pequenos grupos que sostienen la vida comunitaria.`,
      imageUrl: 'https://www.lisanews.org/wp-content/uploads/2025/04/ACTUALIDAD-2025-04-23T103601.604-scaled.png'
    }))
  }
];

export const movementHistory = [
  'Palestra nacio como una respuesta joven al deseo de vivir la fe de una manera cercana, comunitaria y comprometida. Desde sus primeros pasos, el movimiento busco que cada persona pudiera descubrir que Cristo camina con ella en la vida concreta, en la amistad, en el servicio, en la alegria compartida y tambien en las preguntas profundas que aparecen al crecer.',
  'Con el tiempo, distintas comunidades fueron tomando forma en parroquias, colegios, barrios y espacios pastorales. Cada una desarrollo su propio modo de reunirse, cantar, rezar, acompanar y servir, pero todas conservaron una misma intuicion: nadie camina solo cuando encuentra una comunidad que lo recibe y lo ayuda a mirar la vida con esperanza.',
  'En Argentina, Palestra fue extendiendose por provincias donde muchos jovenes encontraron un lugar para formarse, asumir responsabilidades y descubrir una vocacion de servicio. Salta, Jujuy, Tucuman, Catamarca, Cordoba y San Luis sostienen hoy una red viva de comunidades con historias distintas, marcadas por encuentros, jornadas, misiones, retiros, reuniones semanales y gestos silenciosos de acompanamiento.',
  'Esta aplicacion busca continuar esa historia en clave digital. No reemplaza la vida comunitaria ni el encuentro cara a cara, sino que intenta ordenar la comunicacion, acercar materiales, visibilizar comunidades y cuidar los espacios internos del movimiento. Es una herramienta sencilla para que Palestra pueda seguir caminando con unidad, memoria y creatividad.'
];

export const contactInfo = {
  email: 'contacto@palestra.org.ar',
  phone: '+54 9 11 2456-7890',
  instagram: '@palestra.argentina',
  helpText: 'Si estas buscando una comunidad, queres acercarte por primera vez o necesitas hablar con alguien del movimiento, escribinos y te orientamos segun tu provincia.',
  donationText: 'Si queres colaborar con materiales, traslados o actividades comunitarias, contactanos y te contamos las formas disponibles.'
};

export const faqItems = [
  {
    question: 'Quiero sumarme, que hago?',
    answer: 'Escribi por contacto y te orientamos hacia una comunidad cercana segun tu provincia.'
  },
  {
    question: 'Puedo cambiar mi comunidad de origen?',
    answer: 'Si. En la app quedara una solicitud para que un dirigente revise el cambio.'
  },
  {
    question: 'Como se aprueba un rango?',
    answer: 'Los rangos se aprueban segun la estructura del movimiento y los permisos de cada dirigente.'
  }
];

export const demoRequests = [
  'Solicitud de perseverancia',
  'Necesito contactar un dirigente'
];

export const internalMessages = [
  {
    from: 'Coordinacion',
    title: 'Mensaje para la comunidad',
    body: 'Recordatorio ficticio para revisar horarios y confirmar asistencia.'
  },
  {
    from: 'Vocalia',
    title: 'Comunicado provincial',
    body: 'Mensaje ficticio para probar bandeja de comunicados internos.'
  }
];

export const pendingUsers = [
  {
    name: 'Sofia Mercado',
    province: 'Tucuman',
    requestedRole: 'Sedimentador',
    status: 'Pendiente'
  },
  {
    name: 'Juan Pereyra',
    province: 'Catamarca',
    requestedRole: 'Palestrista',
    status: 'Observado'
  }
];

export const auditLog = [
  'Lucia Rios publico una noticia en Comunidad Cordoba 1.',
  'Vocal Demo aprobo un usuario sedimentador.',
  'Coordinacion Nacional actualizo permisos de prueba.'
];

export const roleDefinitions = [
  {
    role: 'invitado',
    label: 'Invitado',
    description: 'Solo puede ver inicio, noticias, comunidades, historia y contacto.'
  },
  {
    role: 'palestrista',
    label: 'Palestrista',
    description: 'Iniciador dentro del movimiento. Puede descargar archivos y ver noticias de su comunidad.'
  },
  {
    role: 'sedimentador',
    label: 'Sedimentador',
    description: 'Hizo el PM. Puede descargar archivos exclusivos y ver fechas no publicas.'
  },
  {
    role: 'coordinador_comunidad',
    label: 'Coordinador de comunidad',
    description: 'Gestiona noticias, horarios, fechas especiales y mensajes de su comunidad.'
  },
  {
    role: 'animador_comunidad',
    label: 'Animador de comunidad',
    description: 'Acompana iniciadores y gestiona comunicacion comunitaria.'
  },
  {
    role: 'vocal',
    label: 'Vocal',
    description: 'Controla publicaciones, aprueba sedimentadores y otorga roles provinciales.'
  },
  {
    role: 'coordinador_diocesano',
    label: 'Coordinador Diocesano',
    description: 'Gestiona como vocal y puede otorgar roles de Vocal y Asesor.'
  },
  {
    role: 'asesor',
    label: 'Asesor',
    description: 'Cargo honorifico con seccion exclusiva y atribuciones de coordinador de comunidad.'
  },
  {
    role: 'vocal_nacional',
    label: 'Vocal Nacional',
    description: 'Puede modificar contenido en todas las provincias.'
  },
  {
    role: 'coordinador_nacional',
    label: 'Coordinador Nacional',
    description: 'Gestiona permisos de todos los roles y otorga el cargo de Vocal Nacional.'
  },
  {
    role: 'administrador',
    label: 'Administrador',
    description: 'Perfil tecnico de maxima confianza. Puede gestionar estructura, roles, permisos, pestanas, comunidades y configuracion global.'
  }
];

export const communityNews = [
  {
    community: 'Comunidad Tucuman 1',
    title: 'Reunion semanal de la comunidad',
    body: 'Noticia ficticia interna para quienes pertenecen a Comunidad Tucuman 1.'
  },
  {
    community: 'Comunidad Tucuman 1',
    title: 'Servicio comunitario del mes',
    body: 'Actividad ficticia organizada por la comunidad de origen del perfil demo.'
  },
  {
    community: 'Comunidad Salta 1',
    title: 'Encuentro local',
    body: 'Noticia ficticia para una comunidad de Salta.'
  }
];
