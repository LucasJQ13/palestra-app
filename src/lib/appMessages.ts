import { Role, Session, UserStatus } from '../types/auth';

export type MessageTone = 'functional' | 'fraternal' | 'pastoral';
export type MessageGenderPreference = Session['genderPreference'];
export type EmptyStateContext =
  | 'auth'
  | 'profile'
  | 'community'
  | 'mailbox'
  | 'materials'
  | 'qr'
  | 'notifications'
  | 'content'
  | 'admin'
  | 'generic';

type Treatment = {
  sibling: string;
  welcome: string;
  dear: string;
};

export const APP_MESSAGES = {
  supabaseConnectionError: 'No pudimos conectar con Supabase. Revisa la conexion e intenta nuevamente.',
  saveFailed: 'No pudimos guardar los cambios.',
  operationFailed: 'No pudimos completar la accion. Revisa los datos e intenta nuevamente.',
  messageSent: 'Mensaje enviado.',
  messageSentDone: 'Mensaje enviado.',
  messageSentCorrectly: 'Mensaje enviado correctamente.',
  responseSent: 'Respuesta enviada.',
  reportSentForReview: 'Reporte enviado para revision. Gracias por cuidar la comunidad.',
  reportSentForModeration: 'Reporte enviado para moderacion. Gracias por cuidar la comunidad.',
  selectQrList: 'Selecciona una lista QR antes de continuar.',
  photoPermission: 'Necesitamos permiso para acceder a tus fotos.',
  imageSelectionPermission: 'Necesitamos permiso para seleccionar imagen.',
  imageSelectionPermissionWithArticle: 'Necesitamos permiso para seleccionar una imagen.',
  chooseImagePermission: 'Necesitamos permiso para elegir una imagen.',
  profileReadFailed: 'No pudimos preparar tu perfil. Volvé a intentarlo en unos minutos.',
  auth: {
    brandSubtitle: 'Movimiento Católico',
    loginTitle: 'Qué alegría encontrarte de nuevo',
    loginHelp: 'Ingresá para seguir caminando junto a tu comunidad.',
    guestTitle: 'Estás visitando Palestra',
    guestHelp: 'Podés conocer el inicio, las noticias, las comunidades, nuestra historia y los espacios de contacto.',
    guestLoginTab: 'Iniciar sesión',
    guestRegisterTab: 'Quiero sumarme',
    guestRegisterTitle: '¿Querés sumarte a Palestra?',
    guestRegisterHelp: 'Sumate a Palestra. Un dirigente de tu comunidad revisará el perfil para darte la bienvenida.',
    guestRegisterSubmit: 'Sumarme a Palestra',
    emailLabel: 'Mail',
    emailPlaceholder: 'tu.mail@email.com',
    signInEmailPlaceholder: 'Ingresá tu correo',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Ingresá tu contraseña',
    passwordMinimumPlaceholder: 'Mínimo 6 caracteres',
    passwordConfirmLabel: 'Confirmar contraseña',
    passwordConfirmPlaceholder: 'Repetí tu contraseña',
    invalidEmail: 'Revisá el mail: necesitamos una dirección válida para seguir.',
    passwordRequired: 'Ingresá tu contraseña para continuar.',
    fullNameRequired: 'Ingresá tu nombre completo.',
    provinceRequired: 'Elegí tu provincia.',
    registrationCommunityRequired: 'Elegí tu comunidad.',
    startYearRequired: 'Elegí el año de inicio.',
    passwordMismatch: 'Las contraseñas no coinciden.',
    loginLoading: 'Estamos preparando tu ingreso...',
    loginSuccess: 'Sesión iniciada.',
    recoveryTitle: 'Recuperar contraseña',
    recoveryHelp: 'Ingresá tu mail. Si encontramos tu cuenta, te enviaremos un enlace para crear una nueva contraseña.',
    recoveryInvalidEmail: 'Escribí un mail válido para enviarte el enlace de recuperación.',
    recoverySending: 'Estamos enviando las instrucciones a tu correo...',
    recoverySendingShort: 'Enviando...',
    recoveryFailed: 'No pudimos enviar el enlace. Revisá el mail y volvé a intentarlo en unos minutos.',
    recoverySent: 'Si encontramos tu cuenta, vas a recibir los pasos para recuperar el acceso.',
    recoverySubmit: 'Enviar enlace',
    recoveryBack: 'Volver al inicio de sesión',
    loginSubmit: 'Iniciar sesión',
    loginLoadingShort: 'Ingresando...',
    registerLink: 'Quiero registrarme',
    forgotPassword: 'Olvidé mi contraseña',
    enterButton: 'Ingresar',
    sendingHelpRequest: 'Estamos avisando a un dirigente...',
    backToLogin: 'Volver al inicio de sesión',
    registerSubmit: 'Unirme a Palestra',
    registerLoading: 'Estamos preparando tu registro...',
    registerLoadingShort: 'Registrando...',
    continueButton: 'Continuar',
    registrationCreatedPending: 'Tu registro está en camino. Un dirigente lo revisará para darte la bienvenida.',
    registrationCreatedEmailPending: 'Tu registro está en camino. Confirmá el correo y después vas a poder ingresar.',
    emailConfirmationSent: 'Te enviamos un correo de confirmación. Revisá tu bandeja para activar la cuenta.',
    emailConfirmationErrorTitle: 'Todavía no pudimos confirmar tu correo',
    emailConfirmationSuccessTitle: '¡Tu correo ya está confirmado!',
    emailConfirmationSuccessText: 'Todo listo. Ya podés entrar y encontrarte con tu comunidad en Palestra.',
    emailConfirmationFailed: 'No pudimos confirmar tu correo. Pedí un nuevo mail e intentá nuevamente.',
    emailConfirmationLinkFailed: 'No pudimos abrir ese enlace de confirmación. Volvé a Palestra e intentá iniciar sesión.',
    emailConfirmationSuccessToast: 'Tu correo ya está confirmado.',
    pendingProfileTitle: 'Tu perfil está en camino',
    pendingProfileSubtitle: 'Revisá tu correo para confirmar la cuenta',
    pendingEmailEyebrow: 'Correo pendiente de confirmación',
    pendingEmailHelp: 'Revisá tu correo para confirmar la cuenta. Si necesitás ayuda, desde acá podés avisarle a un dirigente.',
    requestLeaderHelp: 'Si no llega el correo, avisale a un dirigente',
    requestLeaderHelpDone: 'Listo. Un dirigente podrá acompañarte con la confirmación.',
    requestLeaderHelpFailed: 'No pudimos avisarle a un dirigente. Volvé a intentarlo en unos minutos.',
    passwordRecoveryReceived: 'Recibimos tu enlace de recuperación. Iniciá sesión o actualizá tu contraseña desde Mi Perfil.',
    signOut: 'Cerrar sesión',
    back: 'Atrás',
    pageLabel: 'Página',
    firstNameLabel: 'Nombre',
    lastNameLabel: 'Apellido',
    fullNameLabel: 'Nombre completo',
    lastNamePending: 'Pendiente',
    provinceLabel: 'Provincia',
    contactLabel: 'Contacto',
    communityLabel: 'Comunidad',
    nicknameLabel: 'Apodo',
    startYearLabel: 'Año de inicio en el Movimiento',
    selectProvince: 'Elegí tu provincia',
    selectCommunity: 'Elegí tu comunidad',
    selectStartYear: 'Elegí el año',
    nameRequired: 'Necesitamos tu nombre y apellido para crear tu perfil.',
    aboutRequired: 'Agregá tu fecha de nacimiento y un contacto para que tu comunidad pueda acompañarte.',
    communityRequired: 'Elegí provincia, comunidad y año de inicio para ubicarte dentro de Palestra.',
    invalidEmailDomain: 'El dominio del mail no parece recibir correos. Revisalo antes de seguir.',
    unavailableEmailDomain: 'El dominio del mail no existe o no recibe correo.',
    domainValidationFailed: 'No pudimos validar el dominio del mail. Revisá tu conexión e intentá nuevamente.',
    emailAlreadyRegistered: 'Ese mail ya tiene una cuenta. Ingresá o recuperá tu contraseña.',
    shortPassword: 'La contraseña debe tener al menos 6 caracteres.',
    narrativeRequired: 'Elegí cómo querés que te acompañemos en los saludos.',
    validatingEmail: 'Validando mail...',
    wizardNameTitle: '¿Cómo te llamás?',
    wizardNameHelp: 'Queremos conocerte un poco más para acompañar tu camino en Palestra.',
    wizardAboutTitle: 'Contanos un poco de vos',
    wizardAboutHelp: 'Estos datos nos ayudan a acompañarte y vincularte con tu comunidad.',
    wizardCommunityTitle: 'Comunidad y acceso',
    wizardCommunityHelp: 'Elegí dónde participás actualmente y prepará tus datos de ingreso.',
    wizardNarrativeTitle: 'Cómo acompañarte',
    wizardNarrativeHelp: 'Elegí el trato que preferís para recibir saludos más personales.',
    profileRefreshed: 'Tu perfil está actualizado.',
    noActiveSession: 'No encontramos una sesión activa. Cerrá e iniciá sesión nuevamente.',
    invalidCredentials: 'El mail o la contraseña no coinciden. Revisalos y volvé a intentarlo.',
    emailNotConfirmed: 'Tu correo todavía no está confirmado. Revisá tu bandeja o pedí ayuda a un dirigente.',
    passwordReview: 'Revisá la contraseña indicada.',
    genericError: 'Algo no salió como esperábamos. Revisá los datos y volvé a intentarlo.'
  },
  home: {
    quickAccessTitle: 'Accesos para caminar',
    summaryTitle: 'Vida de la comunidad',
    newsMeta: 'Avisos y novedades',
    communitiesMeta: 'Provincias y contactos',
    materialsMeta: 'Materiales para el camino',
    forumMeta: 'Dialogo comunitario',
    profileGuestTitle: 'Ingresar',
    profileGuestMeta: 'Tu cuenta palestrista',
    guestStatus: 'Entrar a Palestra',
    gospelTitle: 'Evangelio del Dia',
    gospelMeta: 'Lectura para rezar hoy',
    gospelLoading: 'Estamos preparando el Evangelio del dia...',
    gospelRefreshing: 'Actualizando el Evangelio del dia...',
    gospelLoadingAutomatic: 'Buscando el Evangelio de hoy...',
    gospelUnavailable: 'Todavia no tenemos cargado el Evangelio de hoy. Volve a intentar en unos minutos.',
    gospelAutoFailed: 'No pudimos cargar el Evangelio automaticamente. Podes intentar de nuevo en unos minutos.',
    gospelReflectionShow: 'Reflexion',
    gospelReflectionHide: 'Ocultar reflexion',
    gospelUpdate: 'Actualizar',
    gospelSource: 'Fuente',
    instagramTitle: 'Instagram Palestrista',
    upcomingEyebrow: 'Proximamente',
    viewAll: 'Ver todas',
    agendaTitle: 'Agenda comunitaria',
    agendaEmpty: 'Por ahora no hay fechas comunitarias publicadas.',
    infoTitle: 'Info Palestrista',
    privateNotice: 'Para cuidar este espacio, algunas secciones se abren cuando tu registro ya fue aprobado por un dirigente.',
    remoteContentEmpty: 'Todavia no hay contenido publicado para esta seccion.',
    genericPageEmpty: 'Esta pagina todavia no tiene contenido cargado.',
    linksEmpty: 'Todavia no hay enlaces cargados.',
    libraryEmptyHelp: 'Cuando se publique contenido, aparecera aca para la comunidad.',
    motivadorEmptyTitle: 'No hay PM activos',
    motivadorEmptyText: 'Por ahora no hay Periodos Motivadores publicados.',
    externalNewsLoading: 'Estamos buscando noticias de la Iglesia...',
    externalNewsUnavailable: 'No pudimos cargar noticias externas en este momento. Volve a intentar mas tarde.'
  },
  community: {
    myCommunityTitle: 'Mi comunidad',
    myCommunityFallback: 'Tu comunidad',
    provinceFallback: 'Provincia pendiente',
    refreshMyCommunity: 'Actualizar mi comunidad',
    openCommunityPanel: 'Cuidar mi comunidad',
    panelBack: 'Volver a mi comunidad',
    panelEyebrow: 'Herramientas para servir',
    panelTitle: (name?: string | null) => `Panel de ${name || 'la comunidad'}`,
    leadersTitle: 'Encargados y acompanamiento',
    leadersHint: 'Animacion, coordinacion y asesoria que acompanan esta comunidad.',
    leadersEmpty: 'Todavia no hay encargados cargados para esta comunidad.',
    noticesTitle: 'Avisos de mi comunidad',
    noticesHint: 'Comunicados y novedades para caminar juntos.',
    noticesEmpty: 'Tu comunidad todavia no publico avisos. Cuando haya novedades, las vas a ver aca.',
    noticeOfficial: 'Comunicado oficial',
    noticeFallbackTitle: 'Aviso comunitario',
    noticeReadOnly: 'Solo lectura',
    noticePublishTitle: 'Nuevo aviso para la comunidad',
    noticePublishHelp: 'Publica un comunicado claro para acompanar e informar a la comunidad.',
    noticePublishButton: 'Publicar aviso',
    noticeNotifyTitle: 'Avisar a miembros',
    noticeNotifyHelp: 'Ademas de publicar, prepara una notificacion para la comunidad.',
    noticePublishedTitle: 'Avisos publicados',
    noticeSaveChanges: 'Guardar cambios',
    noticeEditClose: 'Cerrar edicion',
    noticeTitlePlaceholder: 'Titulo del aviso',
    noticeSubtitlePlaceholder: 'Subtitulo opcional',
    noticeBodyPlaceholder: 'Comunicado para la comunidad',
    noticeImageUrlPlaceholder: 'O pega un enlace https:// de imagen',
    noticeLinkLabelPlaceholder: 'Texto del boton, por ejemplo: Ver inscripcion',
    noticeLinkUrlPlaceholder: 'Enlace opcional https://',
    membersTitle: 'Miembros de la comunidad',
    membersCount: (count: number) => `${count} personas vinculadas a la comunidad.`,
    membersEmpty: 'Todavia no hay miembros cargados.',
    membersShow: 'Ver miembros',
    membersHide: 'Ocultar lista',
    detailsTitle: 'Identidad de la comunidad',
    detailsHelp: 'Actualiza la presentacion y el banner de tu comunidad.',
    detailsPlaceholder: 'Descripcion, frase o lema de la comunidad',
    detailsSave: 'Guardar identidad',
    bannerChange: 'Cambiar banner',
    bannerAdd: 'Agregar banner',
    adminTitle: 'Gestionar comunidades',
    adminHelp: 'Crea, edita, habilita o archiva comunidades segun tu jurisdiccion.',
    adminNoEditable: 'Tu rango no tiene comunidades editables por ahora.',
    visibleSubsections: 'Subsecciones visibles',
    visibleSubsectionsHelp: (province: string) => `Activa o desactiva secciones para ${province}.`,
    visibleInCommunities: 'Visible en Comunidades',
    hiddenForUsers: 'Oculta para usuarios',
    createCommunity: 'Crear comunidad',
    closeCreation: 'Cerrar creacion',
    communityNamePlaceholder: 'Nombre de comunidad',
    unnamedCommunity: 'Comunidad sin nombre',
    optionalImageHelp: 'La imagen es opcional. Recomendamos 1200x800 px en proporcion 3:2.',
    existingCommunities: 'Comunidades existentes',
    locationTitle: 'Ubicacion',
    coordinatesHelp: 'Cargar coordenadas ayuda a encontrar la comunidad cercana. Podes copiarlas desde Google Maps.',
    imageTitle: 'Imagen de comunidad',
    imageHelp: 'Imagen recomendada: 1200x800 px. La app conserva la proporcion 3:2 antes de guardar.',
    imagePreviewReady: 'Vista previa lista. Guarda la comunidad para subirla y asociarla.',
    saveCommunity: 'Guardar comunidad',
    savingCommunity: 'Guardando comunidad...',
    creatingCommunity: 'Creando comunidad...',
    communityCreated: 'Comunidad creada.',
    communityUpdated: 'Datos de la comunidad actualizados.',
    communitySaveFailed: 'No pudimos guardar los datos de la comunidad.',
    communityImageFailed: 'No pudimos subir la imagen de la comunidad.',
    communityCreatedImageFailed: 'Comunidad creada, pero no pudimos subir la imagen.',
    chooseCommunityForImage: 'Elegi una comunidad antes de cargar imagen.',
    chooseCommunityForEdit: 'Elegi una comunidad cargada para editar.',
    cannotCreateCommunity: 'Tu rango no puede crear comunidades.',
    cannotUploadCommunityImage: 'Tu rango no puede cargar imagenes de comunidad.',
    cannotChangeCommunityImage: 'Tu rango no puede cambiar la imagen de esta comunidad.',
    cannotEditCommunity: 'No tenes permiso para editar esta comunidad.',
    cannotPublishNotice: 'No tenes permiso para publicar avisos en esta comunidad.',
    cannotEditNotice: 'No tenes permiso para editar avisos de esta comunidad.',
    cannotDeleteNotice: 'No tenes permiso para eliminar avisos de esta comunidad.',
    findNearestTitle: 'Buscar comunidad mas cercana',
    findNearestHelp: 'Usa tu ubicacion actual para encontrar comunidades cargadas dentro de 5 km.',
    findNearestButton: 'Buscar comunidad cercana',
    findingLocation: 'Buscando tu ubicacion...',
    locationPermissionDenied: 'Para buscar una comunidad cercana necesitamos tu ubicacion. Activala y volve a intentar.',
    noCoordinates: 'Todavia no hay comunidades con ubicacion cargada para calcular distancias.',
    noNearby: 'No encontramos una comunidad dentro de 5 km.',
    noNearbyWithNearest: (name: string, km: number) => `No encontramos una comunidad dentro de 5 km. La mas cercana cargada es ${name}, a ${km.toFixed(2)} km.`,
    locationFailed: 'No pudimos leer tu ubicacion actual.',
    secretariats: 'Secretariados',
    diocesanSecretariat: 'Nuestro Secretariado',
    diocesanSecretariatHelp: (province: string) => `Vocales y Coordinacion Diocesana que acompanan ${province}.`,
    nationalSecretariat: 'Secretariado Nacional',
    nationalSecretariatHelp: 'Referentes nacionales del Movimiento.',
    secretariatLoading: 'Cargando secretariado...',
    secretariatEmpty: 'Todavia no hay integrantes cargados para este secretariado.',
    nameAndContactRequired: 'Dejanos tu nombre y un medio de contacto para que podamos acompanarte.',
    messageRequired: 'Contanos brevemente en que podemos acompanarte.',
    secretariatSent: 'Tu consulta llego al Secretariado. Gracias por escribirnos.',
    contactSent: 'Tu consulta llego a la comunidad. Gracias por acercarte.',
    selectedCommunityMissing: 'No encontramos la comunidad seleccionada.',
    closeCommunity: 'Cerrar comunidad',
    openLocation: 'Abrir ubicacion',
    sendMessage: 'Escribir a la comunidad',
    messageToLeaders: 'Conversemos con la comunidad',
    contactNameLabel: 'Tu nombre',
    contactNamePlaceholder: 'Nombre y apellido',
    contactMethodLabel: 'Como podemos responderte?',
    contactPlaceholder: 'Ej: nombre@email.com o telefono',
    queryMessageLabel: 'Tu consulta',
    communityMessagePlaceholder: 'Contanos como podemos acompanarte',
    secretariatMessagePlaceholder: 'Contanos como puede acompanarte el Secretariado',
    sendQuery: 'Acercar consulta',
    closeQuery: 'Cerrar consulta',
    presentationHint: 'Tocar para ver presentacion',
    activeCommunities: (count: number) => `${count} comunidades activas`,
    noSubsections: 'Esta provincia todavia no tiene subsecciones habilitadas.',
    nearestUserLocation: (address: string) => `Tu ubicacion: cerca de ${address || 'tu posicion actual'}`,
    nearestCommunityLocation: (address: string) => `Comunidad: ${address}`,
    routeHint: 'Tocar para abrir ruta interactiva',
    mapTitle: 'Mapa interactivo',
    openGoogleMaps: 'Abrir en Google Maps',
    advisorTitle: 'Asesores de comunidad',
    advisorHelp: 'Vincula asesores oficiales con una comunidad y administra sus reemplazos.',
    advisorEmpty: 'Todavia no hay asesores vinculados a esta comunidad.',
    advisorAssigned: 'Asesor asignado a la comunidad.',
    advisorRemoved: 'Asignacion de asesor eliminada.'
  },
  communications: {
    mailbox: {
      title: 'Conversaciones',
      help: 'Un espacio privado para encontrarnos y acompanarnos entre quienes formamos Palestra.',
      newAction: 'Escribir mensaje',
      closeComposer: 'Cerrar',
      refresh: 'Actualizar',
      composerTitle: 'Nuevo mensaje',
      conductHelp: 'Escribamos con respeto y cuidado. Si algo vulnera este espacio, puede reportarse para que lo revise el equipo autorizado.',
      destinationLabel: 'A quien queres escribirle?',
      targetUser: 'Una persona',
      targetRole: 'Un rango',
      targetProvince: 'Una provincia',
      targetRoleProvince: 'Rango y provincia',
      targetAll: 'Toda Palestra',
      targetDiocesanLeadership: 'Dirigencia diocesana',
      targetCommunity: 'Una comunidad',
      targetProvinceCommunities: 'Responsables de mi provincia',
      targetMyCommunity: 'Responsables de mi comunidad',
      provinceLabel: 'Provincia destinataria',
      allProvinces: 'Todas las provincias',
      selectProvince: 'Elegi una provincia',
      roleLabel: 'Rango destinatario',
      userSearchLabel: 'Buscar a una persona',
      userSearchPlaceholder: 'Nombre, provincia, comunidad o rango',
      selectedUsers: (count: number) => count === 1 ? '1 persona seleccionada' : `${count} personas seleccionadas`,
      noUserResults: 'No encontramos personas con esa busqueda.',
      unnamedUser: 'Palestrista sin nombre visible',
      userFallback: 'Palestrista',
      noCommunity: 'Comunidad pendiente',
      noProvince: 'Provincia pendiente',
      moreSelected: (count: number) => `+${count} mas`,
      estimatedRecipients: (count: number) => count === 1 ? 'Este mensaje llegara a 1 persona.' : `Este mensaje llegara a ${count} personas.`,
      messageLabel: 'Tu mensaje',
      messagePlaceholder: 'Escribi un mensaje breve y claro',
      send: 'Enviar mensaje',
      saveDraft: 'Guardar borrador',
      folders: {
        entrada: 'Recibidos',
        enviados: 'Enviados',
        eliminados: 'Eliminados'
      },
      empty: 'Todavia no hay conversaciones en esta bandeja. Cuando llegue un mensaje, lo vas a encontrar aca.',
      statusNew: 'Sin leer',
      statusSent: 'Enviado',
      statusConversation: 'En conversacion',
      statusReceived: 'Recibido',
      sentPrefix: 'Enviaste: ',
      receivedPrefix: 'Recibiste: ',
      replyPlaceholder: 'Escribi tu respuesta',
      replyUnavailable: 'Esta conversacion no admite respuesta directa',
      actionsTitle: 'Opciones de la conversacion',
      actionsHelp: 'Elegi que queres hacer con esta conversacion.',
      reportConversation: 'Reportar conversacion',
      deleteConversation: 'Eliminar conversacion',
      deleteConversationHelp: 'La conversacion se quitara solo de tu vista. Queres continuar?',
      confirmSendTitle: 'Confirmar envio',
      confirmSend: (count: number) => `Este mensaje llegara a ${count} personas. Queres enviarlo?`,
      loginToSend: 'Inicia sesion para enviar mensajes.',
      messageBeforeSend: 'Escribi un mensaje antes de enviarlo.',
      noCommunityLeaders: 'Todavia no hay responsables asignados a tu comunidad.',
      chooseRecipient: 'Elegi al menos una persona destinataria.',
      noRecipients: 'No encontramos destinatarios con el criterio elegido.',
      loginToSaveDraft: 'Inicia sesion para guardar borradores.',
      messageBeforeDraft: 'Escribi un mensaje antes de guardar el borrador.',
      draftSaved: 'Borrador guardado en este dispositivo.',
      responseBeforeSend: 'Escribi una respuesta antes de enviarla.',
      chooseConversation: 'Elegi una conversacion para responder.',
      directReplyUnavailable: 'Esta conversacion no tiene una persona disponible para responder directamente.',
      receivedReportsOnly: 'Solo podes reportar mensajes recibidos.',
      directMessageUnavailable: 'Este mensaje no permite responder directamente a quien lo envio.',
      directReplyReady: 'La respuesta quedo preparada para la persona que envio el mensaje.',
      messageRestored: 'Mensaje restaurado.'
    },
    publicQueries: {
      title: 'Consultas de la comunidad',
      help: 'Aca acompanamos las consultas publicas e institucionales, separadas de las conversaciones privadas.',
      refresh: 'Actualizar consultas',
      loading: 'Estamos actualizando las consultas...',
      empty: 'No hay consultas para este filtro. Cuando llegue una, la vas a encontrar aca.',
      filters: {
        all: 'Todas',
        new: 'Nuevas',
        read: 'Leidas',
        answered: 'Respondidas',
        archived: 'Archivadas'
      },
      statusLabels: {
        nueva: 'Nueva',
        leida: 'Leida',
        respondida: 'Respondida',
        archivada: 'Archivada'
      },
      statusChanged: (status: string) => `Consulta actualizada: ${status}.`,
      responseRequired: 'Escribi una respuesta o seguimiento antes de guardar.',
      responseSaved: 'Respuesta guardada en la consulta.',
      originLabel: 'De donde llega',
      contactLabel: 'Como responder',
      queryLabel: 'Consulta',
      followUpLabel: 'Respuesta o seguimiento',
      followUpPlaceholder: 'Escribi la respuesta o el seguimiento realizado',
      saveResponse: 'Guardar respuesta',
      archive: 'Archivar',
      restore: 'Volver a recibidas'
    }
  },
  adminPanels: {
    users: {
      toolEyebrow: 'Herramienta',
      listLabel: 'Lista de usuarios',
      listDetail: 'Busca, filtra y edita desde cada fila.',
      createLabel: 'Crear usuario',
      createDetail: 'Alta basica con mail y clave.',
      pendingLabel: 'Pendientes',
      pendingFullLabel: 'Pendientes de aprobacion',
      pendingDetail: 'Revisa registros recientes y asigna el rango correcto.',
      diagnosticLabel: 'Diagnostico',
      diagnosticFullLabel: 'Diagnostico y liberacion',
      diagnosticDetail: 'Repara accesos o libera un correo.',
      noVisibleUsers: 'No encontramos usuarios visibles para tu rango.',
      loading: 'Cargando usuarios...',
      loaded: 'Usuarios cargados.',
      cannotAccess: 'Tu rango no tiene acceso a la herramienta Usuarios.',
      chooseUserToEdit: 'Elegi un usuario para editar.',
      chooseUserToConfirmEmail: 'Elegi un usuario para aprobar email.',
      chooseUserToDelete: 'Elegi un usuario para eliminar.',
      invalidEmail: 'Ingresa un correo valido.',
      invalidDiagnosticEmail: 'Ingresa un mail valido para diagnosticar.',
      invalidRepairEmail: 'Ingresa un mail valido para reparar.',
      invalidReleaseEmail: 'Ingresa un mail valido para liberar.',
      shortPassword: 'La contrasena debe tener al menos 6 caracteres.',
      creating: 'Creando usuario...',
      created: 'Usuario creado y habilitado. Debera completar provincia y comunidad al ingresar.',
      approved: 'Usuario aprobado.',
      saving: 'Guardando usuario...',
      saved: 'Usuario actualizado.',
      saveFailed: 'No pudimos guardar el usuario. Revisa permisos y datos.',
      cannotEditReach: 'No podes editar administradores, usuarios superiores o usuarios fuera de tu alcance.',
      cannotDeleteReach: 'No podes eliminar administradores, usuarios superiores o usuarios fuera de tu alcance.',
      cannotEditOtherProvince: 'No podes editar usuarios de otra provincia.',
      emailAlreadyConfirmed: 'Este usuario ya confirmo el mail. Si corresponde, aprobalo desde Estado/Rol.',
      emailConfirmed: 'Mail confirmado correctamente.',
      deleting: 'Eliminando usuario...',
      deletedAndReleased: 'Usuario eliminado y correo liberado correctamente.',
      diagnosing: 'Diagnosticando usuario...',
      diagnosticReady: 'Diagnostico listo.',
      diagnosticEmpty: 'No hubo respuesta de diagnostico.',
      diagnosticFailed: 'No pudimos diagnosticar el usuario.',
      repairing: 'Reparando usuario...',
      repaired: 'Usuario reparado. Probalo iniciando sesion nuevamente.',
      repairFailed: 'No pudimos reparar el usuario.',
      releasing: 'Liberando correo...',
      releaseFailed: 'No pudimos liberar el correo.'
    },
    overview: {
      noUsers: 'Todavia no hay usuarios cargados para visualizar.',
      quickAccess: 'Accesos rapidos',
      quickNewsCommunity: 'Nuevo aviso comunitario',
      quickNews: 'Nueva noticia',
      quickCoordinations: 'Coordinaciones activas',
      quickCommunitiesCreate: 'Crear comunidad',
      quickCommunities: 'Comunidades',
      quickModeration: 'Moderacion',
      quickUsers: 'Revisar usuarios',
      viewAsTitle: 'Ver como',
      viewAsHelp: 'Simulacion temporal para revisar la app con otros rangos. No cambia permisos reales ni guarda cambios.'
    },
    settings: {
      title: 'Configuracion general',
      help: 'Base para mantenimiento, aviso global, permisos, modulos activos, foro y chat.',
      maintenancePlaceholder: 'Mensaje visible durante mantenimiento',
      navigationOrder: 'Orden de navegacion',
      navigationOrderHelp: 'El orden y visibilidad se administran desde Contenido.',
      save: 'Guardar configuracion',
      saved: 'Configuracion guardada.',
      sectionSaved: (scope: string) => `${scope} guardado.`
    },
    identity: {
      title: 'Identidad de la app',
      help: 'Edita nombre, subtitulo y colores principales sin tocar la logica de la app.',
      appNamePlaceholder: 'Nombre de la app',
      subtitlePlaceholder: 'Subtitulo',
      descriptionPlaceholder: 'Descripcion institucional',
      primaryColor: (value: string) => `Color principal ${value}`,
      secondaryColorHelp: (value: string) => `Secundario ${value}: subtitulos y acentos suaves.`,
      textAndButton: (text: string, button: string) => `Texto ${text} / Boton ${button}`,
      greetingColor: (value: string) => `Nombre del saludo ${value}`,
      versionLegend: 'Leyenda de version',
      partnerTitle: 'Logo de partner o desarrollador',
      partnerHelp: 'Logo opcional y sutil para la carga y el final de Inicio.',
      partnerFileHelp: 'Recomendado: 560 x 112 px (proporción 5:1), PNG o WebP con fondo transparente y hasta 500 KB. Máximo permitido: 1 MB.',
      partnerFileTooLarge: 'El logo supera 1 MB. Reducilo antes de volver a cargarlo.',
      partnerLogoPlaceholder: 'URL HTTPS del logo',
      partnerUpload: 'Subir logo',
      partnerRemove: 'Quitar logo',
      partnerReady: 'Logo listo. Guardá Identidad para publicarlo.',
      saveVerificationFailed: 'No pudimos verificar los cambios guardados. Ejecutá la migración de persistencia de Identidad y volvé a intentar.',
      partnerLinkPlaceholder: 'Link HTTPS opcional al tocar el logo',
      partnerAltPlaceholder: 'Texto accesible. Ej: Sitio del partner',
      partnerVisible: 'Mostrar logo sutil',
      partnerVisibleHelp: 'Si falta el logo o falla la imagen, no se reserva espacio.',
      partnerInvalidLogo: 'La URL del logo debe usar HTTP o HTTPS.',
      partnerInvalidLink: 'El link debe usar HTTP o HTTPS. No se abrira mientras sea invalido.',
      preview: 'Previsualizacion',
      save: 'Guardar identidad'
    },
    homeAdmin: {
      title: 'Home',
      help: 'Control visual del inicio, accesos rapidos y secciones visibles.',
      greetingTitle: 'Saludo editable',
      greetingHelp: 'Variables disponibles: {nombre}, {tratamiento}, {genero_bienvenida}, {rango}.',
      preview: 'Vista previa',
      visibleModules: 'Modulos visibles',
      quickAccessNames: 'Nombres de accesos rapidos',
      save: 'Guardar Home'
    },
    contact: {
      title: 'Contacto modular',
      help: 'Configura canales nacionales, Instagram por provincia y bloques visibles en Contacto.',
      nationalInstagram: 'Instagram nacional',
      provinceInstagram: 'Instagram por provincia',
      dynamicBlocks: 'Bloques dinamicos',
      saveInstagram: 'Guardar Instagram',
      instagramSaved: 'Instagram guardado.',
      addBlock: 'Agregar bloque',
      deleteBlock: 'Eliminar bloque',
      saveFull: 'Guardar contacto completo'
    },
    gospel: {
      title: 'Evangelio del Dia',
      help: 'Configura el Evangelio diario automatico y una carga manual de respaldo.',
      enabled: 'Evangelio activo',
      disabled: 'Evangelio desactivado',
      autoEnabled: 'Actualizacion automatica activa',
      autoDisabled: 'Actualizacion automatica desactivada',
      titleLabel: 'Titulo',
      sourceLabel: 'Fuente del Evangelio',
      reflectionSourceLabel: 'Fuente de reflexion',
      manualLabel: 'Evangelio cargado manualmente',
      save: 'Guardar Evangelio'
    },
    downloads: {
      title: 'Descargas y materiales',
      help: 'Biblioteca editable para enlaces, archivos y visibilidad por rol.',
      load: 'Cargar materiales',
      churchDocuments: 'Documentos de la Iglesia',
      churchDocumentsHelp: 'Botones externos visibles primero en Descargas. Maximo 6.',
      emptyChurchDocuments: 'Carga el listado para ver botones existentes.',
      editButton: 'Editar boton',
      addButton: 'Agregar boton',
      saveButton: 'Guardar boton',
      clear: 'Limpiar',
      currentMaterials: 'Materiales actuales',
      newMaterial: 'Nuevo material',
      saveMaterial: 'Guardar material',
      materialEmpty: 'Todavia no hay materiales cargados.',
      unnamedDocument: 'Documento sin titulo',
      unnamedMaterial: 'Material sin nombre',
      logoAdminOnly: 'Solo Administrador puede subir logos de documentos.',
      uploadingLogo: 'Subiendo logo...',
      logoUploaded: 'Logo cargado.',
      logoFailed: 'No pudimos subir el logo.',
      titleAndLinkRequired: 'Completa titulo y link destino.',
      linkMustUseHttps: 'El link debe empezar con https://',
      maxButtons: 'Solo se permiten hasta 6 botones.',
      churchDocumentSaved: 'Documento de la Iglesia guardado.'
    },
    formation: {
      title: 'Proceso Educativo',
      help: 'Crea y ordena estaciones del camino formativo.',
      noPermission: 'Disponible solo para Administrador.',
      uploadImage: 'Subiendo imagen...',
      imageUploaded: 'Imagen cargada.',
      imageFailed: 'No pudimos subir la imagen.',
      cannotManage: 'No tenes permisos para administrar el Proceso Educativo.',
      titleRequired: 'La estacion necesita un titulo.',
      saved: 'Estacion guardada.',
      activated: 'Estacion activada.',
      deactivated: 'Estacion desactivada.',
      deleted: 'Estacion eliminada.',
      create: 'Crear estacion',
      closeEditor: 'Cerrar editor',
      editSelected: 'Editar seleccion',
      editStation: 'Editar estacion',
      newStation: 'Nueva estacion',
      linkedMaterials: (count: number) => `Materiales vinculados (${count})`,
      noMaterials: 'Todavia no hay materiales cargados.',
      save: 'Guardar estacion',
      loadedStations: 'Estaciones cargadas',
      noStations: 'Todavia no hay estaciones cargadas.',
      unnamedStation: 'Estacion sin titulo',
      visibleForAll: 'Si no seleccionas rangos, queda visible para todos.'
    },
    content: {
      title: 'Contenido publicado',
      help: 'Inventario central para distinguir contenido real y contenido base usado para que la app no quede vacia.',
      editablePages: 'Paginas editables',
      noEditablePages: 'Todavia no hay paginas publicadas cargadas.',
      sourceTab: (tab: string) => `Origen: contenido remoto - pestana ${tab}`,
      fallbackTitle: 'Contenido base / fallback',
      visible: 'visible',
      hidden: 'oculto',
      unnamedPage: 'Contenido sin titulo',
      titleAndBodyRequired: 'Completa titulo y texto antes de guardar el contenido.',
      saving: 'Guardando contenido...',
      saved: 'Contenido actualizado.'
    },
    news: {
      cannotPublish: 'Tu rango no puede publicar noticias.',
      titleAndBodyRequired: 'Completa titulo y texto antes de publicar la noticia.',
      provinceRequired: 'Elegi provincia para publicar la noticia provincial.',
      publishing: 'Publicando noticia...',
      created: 'Noticia creada.',
      createdWithNotification: 'Noticia creada y notificacion preparada.',
      draftsLoaded: 'Borradores cargados.',
      draftsEmpty: 'No hay borradores guardados.',
      unnamedDraft: 'Noticia sin titulo',
      cannotUploadImage: 'Tu rango no puede cargar imagenes de noticias.',
      uploadingImage: 'Subiendo imagen...',
      imageUploaded: 'Imagen cargada. La noticia se publica al tocar Publicar noticia.',
      imageFailed: 'No pudimos subir la imagen.',
      draftRequired: 'Completa titulo y texto antes de guardar el borrador.',
      savingDraft: 'Guardando borrador...',
      draftSaved: 'Borrador guardado.',
      draftUpdated: 'Borrador actualizado.',
      eventRequired: 'Completa titulo, descripcion y fecha antes de publicar el evento.',
      eventPublishing: 'Publicando evento...',
      eventCreated: 'Evento creado.',
      eventCreatedWithNotification: 'Evento creado y notificacion preparada.'
    },
    materials: {
      loaded: 'Descargas cargadas.',
      empty: 'No hay descargas guardadas.',
      cannotSave: 'Solo Vocal Diocesano en adelante puede guardar materiales.',
      titleAndDescriptionRequired: 'Completa nombre y descripcion del material.',
      saving: 'Guardando material...'
    },
    pm: {
      cannotManage: 'No tenes permisos para gestionar PM.',
      requiredFields: 'Completa tipo, numero, provincia, fechas, casa, direccion y horarios.',
      saved: 'PM guardado.',
      archived: 'PM archivado.',
      statusUpdated: (status: string) => `Estado actualizado a ${status}.`
    },
    qr: {
      generatingCredential: 'Generando credencial verificable...',
      credentialFailed: 'No pudimos generar la credencial QR. Ejecuta el patch SQL de credenciales si falta.',
      credentialReady: 'Credencial verificable activa.',
      cannotScan: 'Tu rango no tiene acceso a Escanear QR.',
      chooseListBeforeScan: 'Selecciona una lista QR antes de escanear.',
      cameraPermission: 'Necesitamos permiso de camara para escanear credenciales.',
      scanActivityHelp: 'Apunta la camara al QR para validar la lista.',
      scanCredentialHelp: 'Apunta la camara al QR de la credencial.',
      invalidCredential: 'Credencial no valida.',
      validatingCredential: 'Validando credencial...',
      cannotCreateLists: 'Tu rango no puede crear listas QR.',
      listNameRequired: 'Completa el nombre de la lista.',
      unnamedList: 'Lista QR sin nombre',
      usersRequired: 'Selecciona al menos un usuario para crear la lista.',
      listCreated: 'Lista QR creada.',
      listShared: 'Lista compartida.',
      listEmptyName: 'El nombre de la lista no puede quedar vacio.',
      listUpdated: 'Lista QR actualizada.',
      userAdded: 'Usuario agregado a la lista.',
      usersAdded: 'Usuarios agregados a la lista.',
      userRemoved: 'Usuario quitado de la lista.',
      listDeleted: 'Lista QR eliminada.',
      validatingList: 'Validando credencial contra la lista...',
      userNotRegistered: 'Usuario no registrado para esta actividad.',
      chooseListToExport: 'Selecciona una lista para exportar.'
    },
    permissions: {
      adminOnlyLoad: 'Solo Administrador puede gestionar permisos de rangos.',
      adminOnlySave: 'Solo Administrador puede guardar permisos de rangos.',
      loading: 'Cargando permisos del rango...',
      loaded: 'Permisos cargados.',
      localBase: 'No hay permisos remotos cargados; se muestra base local.',
      saved: 'Permisos del rango actualizados.',
      labelsLoading: 'Cargando etiquetas de rangos...',
      labelsLoaded: 'Etiquetas cargadas.',
      labelsEmpty: 'No hay etiquetas personalizadas cargadas.',
      labelsAdminOnly: 'Solo Administrador puede editar nombres visibles de rangos.',
      provinceRequired: 'Elegi provincia.',
      labelRequired: 'Escribi el nombre visible del rango.',
      labelSaved: 'Etiqueta de rango actualizada.',
      aliasesLoading: 'Cargando alias de rangos...',
      aliasesLoaded: 'Alias cargados.',
      aliasesEmpty: 'No hay alias asignables cargados.',
      rolesHelp: 'Activa o desactiva permisos por rango. Los cambios se leen al iniciar sesion y actualizan tu sesion si corresponde.',
      aliasesHelp: 'Crea alias asignables que heredan permisos y jerarquia del rango base. Se aplican al usuario como nombre visible persistente.'
    },
    navigation: {
      adminOnlyModify: 'Solo el administrador puede modificar los accesos.',
      adminOnlyCreate: 'Solo el administrador puede crear paginas nuevas.',
      adminOnlyOrder: 'Solo el administrador puede ordenar los accesos.',
      adminOnlyDelete: 'Solo el administrador puede eliminar secciones.',
      visibleNameRequired: 'El nombre visible no puede quedar vacio.',
      pageNameRequired: 'Escribi un nombre para la nueva pagina.',
      keyRequired: 'La clave interna no puede quedar vacia.',
      duplicateKey: 'Ya existe una seccion con esa clave interna.',
      tabSaved: 'Pestana actualizada.',
      pageCreated: 'Pagina creada con visibilidad por rol.',
      updatingOrder: 'Actualizando orden de accesos...',
      orderSaved: 'Orden de accesos actualizado.',
      protectedDelete: 'Esta seccion es critica o propia de la app. Podes ocultarla, pero no eliminarla.',
      deleteConfirm: 'Seguro que deseas eliminar esta seccion? Tambien se puede perder contenido asociado.',
      sectionDeleted: 'Seccion eliminada.',
      adminOnlyRestore: 'Solo el administrador puede restaurar navegacion.',
      restoreConfirm: 'Restaurar la navegacion predeterminada? Se reemplazaran nombres, iconos, orden y visibilidad base.',
      restored: 'Navegacion predeterminada restaurada.',
      missingIcon: (icon: string) => `El icono "${icon}" no existe en Ionicons.`
    }
  },
  adminOnly(action: string) {
    return `Esta accion esta reservada para administradores: ${action}.`;
  }
} as const;

export function authStepProgressLabel(step: number, total: number) {
  return `${APP_MESSAGES.auth.pageLabel} ${step} de ${total}`;
}

export function fraternalTreatment(genderPreference?: MessageGenderPreference): Treatment {
  if (genderPreference === 'male') {
    return {
      sibling: 'hermano',
      welcome: 'Bienvenido',
      dear: 'Querido'
    };
  }
  if (genderPreference === 'female') {
    return {
      sibling: 'hermana',
      welcome: 'Bienvenida',
      dear: 'Querida'
    };
  }
  return {
    sibling: 'hermano/a',
    welcome: 'Bienvenido/a',
    dear: 'Querido/a'
  };
}

function firstNameOfSession(session: Pick<Session, 'fullName' | 'nickname' | 'useNicknameInGreetings'> | null) {
  if (!session) {
    return 'Palestrista';
  }
  if (session.useNicknameInGreetings && session.nickname?.trim()) {
    return session.nickname.trim();
  }
  return session.fullName.trim().split(/\s+/)[0] || 'Palestrista';
}

export function fraternalWelcomeMessage(session: Session | null, tone: MessageTone = 'pastoral') {
  const treatment = fraternalTreatment(session?.genderPreference);
  const name = firstNameOfSession(session);
  if (tone === 'functional') {
    return `${treatment.welcome}, ${name}.`;
  }
  if (tone === 'fraternal') {
    return `${treatment.welcome}, ${treatment.sibling} ${name}.`;
  }
  return `${treatment.welcome}, ${treatment.sibling} ${name}. Caminemos juntos en Cristo.`;
}

export function pendingProfileMessage(genderPreference?: MessageGenderPreference, tone: MessageTone = 'pastoral') {
  const treatment = fraternalTreatment(genderPreference);
  const sibling = genderPreference ? `, ${treatment.sibling}` : '';
  if (tone === 'functional') {
    return 'Tu registro quedó pendiente de revisión.';
  }
  if (tone === 'fraternal') {
    return `Tu registro ya está en camino${sibling}.`;
  }
  return `Tu registro ya está en camino${sibling}. Te avisaremos cuando un dirigente lo revise.`;
}

export function blockedProfileMessage(genderPreference?: MessageGenderPreference, tone: MessageTone = 'functional') {
  const treatment = fraternalTreatment(genderPreference);
  const sibling = genderPreference ? `, ${treatment.sibling}` : '';
  if (tone === 'pastoral') {
    return `Tu acceso está pausado por ahora${sibling}. Escribí a un dirigente para que podamos acompañarte.`;
  }
  return 'Tu acceso está pausado por ahora. Escribí a un dirigente para que podamos acompañarte.';
}

export function accountStatusMessage(status: UserStatus, genderPreference?: MessageGenderPreference, tone: MessageTone = 'fraternal') {
  if (status === 'aprobado') {
    const treatment = fraternalTreatment(genderPreference);
    if (tone === 'functional') {
      return 'Perfil aprobado.';
    }
    if (!genderPreference) {
      return 'Tu perfil fue aprobado. Te damos la bienvenida a Palestra APP.';
    }
    return `Tu perfil fue aprobado. ${treatment.welcome} a Palestra APP.`;
  }
  if (status === 'bloqueado') {
    return blockedProfileMessage(genderPreference, tone === 'pastoral' ? 'pastoral' : 'functional');
  }
  return pendingProfileMessage(genderPreference, tone);
}

export function emptyStateMessage(context: EmptyStateContext = 'generic', genderPreference?: MessageGenderPreference, tone: MessageTone = 'functional') {
  const treatment = fraternalTreatment(genderPreference);
  const messages: Record<EmptyStateContext, string> = {
    auth: 'No encontramos datos para mostrar en este momento.',
    profile: 'Todavia no hay datos cargados en este perfil.',
    community: 'Todavia no hay informacion cargada para esta comunidad.',
    mailbox: 'No hay mensajes en esta bandeja por ahora.',
    materials: 'Todavia no hay materiales disponibles.',
    qr: 'Todavia no hay listas QR disponibles.',
    notifications: 'No hay notificaciones para mostrar.',
    content: 'Todavia no hay contenido publicado para esta seccion.',
    admin: 'No hay datos administrativos para revisar por ahora.',
    generic: 'Todavia no hay informacion para mostrar.'
  };
  if (tone === 'fraternal') {
    return `${messages[context]} Gracias por esperar, ${treatment.sibling}.`;
  }
  if (tone === 'pastoral') {
    return `${messages[context]} Cuando haya novedades, las vamos a acercar a la comunidad.`;
  }
  return messages[context];
}

export function accessRequiredMessage(
  context: EmptyStateContext = 'generic',
  genderPreference?: MessageGenderPreference,
  tone: MessageTone = 'functional',
  action?: string
) {
  const treatment = fraternalTreatment(genderPreference);
  const purpose = action?.trim();
  if (purpose) {
    if (tone === 'pastoral') {
      return `Para cuidar este espacio comunitario, necesitas ingresar con una cuenta aprobada para ${purpose}.`;
    }
    if (tone === 'fraternal') {
      return `Para ${purpose}, ${treatment.sibling}, necesitas ingresar con una cuenta aprobada.`;
    }
    return `Necesitas ingresar con una cuenta aprobada para ${purpose}.`;
  }
  if (tone === 'fraternal') {
    return `Para continuar, ${treatment.sibling}, necesitas ingresar con una cuenta aprobada.`;
  }
  if (tone === 'pastoral') {
    return `Para cuidar este espacio comunitario, necesitamos que ingreses con una cuenta aprobada.`;
  }
  if (context === 'qr') {
    return 'Esta herramienta esta reservada para rangos dirigenciales habilitados.';
  }
  return 'Necesitas ingresar con una cuenta aprobada para continuar.';
}

export function actionDoneMessage(action: string, genderPreference?: MessageGenderPreference, tone: MessageTone = 'fraternal') {
  const trimmedAction = action.trim().replace(/\.$/, '');
  if (tone === 'functional') {
    return `Listo. ${trimmedAction}.`;
  }
  const treatment = fraternalTreatment(genderPreference);
  if (tone === 'pastoral') {
    return `Listo, ${treatment.sibling}. ${trimmedAction}. Gracias por cuidar este camino.`;
  }
  return `Listo, ${treatment.sibling}. ${trimmedAction}.`;
}

export function statusLabel(status: UserStatus) {
  if (status === 'aprobado') {
    return 'Aprobado';
  }
  if (status === 'bloqueado') {
    return 'Bloqueado';
  }
  return 'Pendiente de aprobacion';
}

export function changeDone(detail: string) {
  return actionDoneMessage(detail, null, 'functional');
}

export function isMissingProfileScope(session: Session | null) {
  if (!session || session.role === 'invitado') {
    return false;
  }
  return !session.province || session.province === 'Sin provincia' || !session.communityOfOrigin || session.communityOfOrigin === 'Sin comunidad asignada';
}

export function provinceDowngradesRole(role: Role) {
  return ['animador_comunidad', 'coordinador_comunidad', 'vocal', 'coordinador_diocesano'].includes(role);
}

export function communityDowngradesRole(role: Role) {
  return ['animador_comunidad', 'coordinador_comunidad'].includes(role);
}

export function roleAfterScopeChange(role: Role, changesProvince: boolean, changesCommunity: boolean): Role {
  if (['administrador', 'coordinador_nacional', 'vocal_nacional', 'asesor'].includes(role)) {
    return role;
  }
  if (changesProvince && ['vocal', 'coordinador_diocesano'].includes(role)) {
    return 'sedimentador';
  }
  if ((changesProvince || changesCommunity) && ['animador_comunidad', 'coordinador_comunidad'].includes(role)) {
    return 'sedimentador';
  }
  return role;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function emailDomainOf(value: string) {
  return value.trim().toLowerCase().split('@')[1] ?? '';
}

export function hasPlausibleEmailDomain(value: string) {
  const domain = emailDomainOf(value);
  if (!domain || domain.length > 253 || domain.includes('..')) {
    return false;
  }
  const labels = domain.split('.');
  if (labels.length < 2) {
    return false;
  }
  return labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
    && /^[a-z]{2,24}$/.test(labels[labels.length - 1]);
}

export async function verifyEmailDomainExists(value: string) {
  const domain = emailDomainOf(value);
  if (!hasPlausibleEmailDomain(value)) {
    return false;
  }
  try {
    const mxResponse = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`);
    const mxData = await mxResponse.json();
    if (mxData?.Status === 0 && Array.isArray(mxData.Answer) && mxData.Answer.length > 0) {
      return true;
    }
    const aResponse = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
    const aData = await aResponse.json();
    return Boolean(aData?.Status === 0 && Array.isArray(aData.Answer) && aData.Answer.length > 0);
  } catch {
    return null;
  }
}

export function friendlyUploadError(message?: string | null) {
  const text = String(message ?? '');
  if (/row-level security|violates row-level|policy/i.test(text)) {
    return 'No tenes permisos para subir este archivo. Revisa tu rango, provincia o la configuracion de permisos de materiales.';
  }
  if (/storage|bucket|object/i.test(text)) {
    return 'No pudimos guardar el archivo en Storage. Revisa permisos de Supabase e intenta nuevamente.';
  }
  return text || APP_MESSAGES.operationFailed;
}

export function safeAuthError(message?: string) {
  const text = (message ?? '').toLowerCase();
  if (text.includes('invalid login') || text.includes('invalid credentials')) {
    return APP_MESSAGES.auth.invalidCredentials;
  }
  if (text.includes('email not confirmed')) {
    return APP_MESSAGES.auth.emailNotConfirmed;
  }
  if (text.includes('already') || text.includes('existe')) {
    return APP_MESSAGES.auth.emailAlreadyRegistered;
  }
  if (text.includes('password') || text.includes('contrasena')) {
    return APP_MESSAGES.auth.passwordReview;
  }
  return APP_MESSAGES.auth.genericError;
}
