import React, { useEffect, useState } from 'react';
import { Alert, Image, Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppContentBlock, AppMaterialRecord, ChurchDocumentButtonRecord, archiveAppMaterial, archiveChurchDocumentButton, fetchAppMaterials, fetchChurchDocumentButtons, saveAppMaterial, saveChurchDocumentButton, updateAppContent } from '../lib/profiles';
import { PageEditorProps } from '../lib/navigationConstants';
import { canManagePublishedContent, hasPermission } from '../lib/sessionAccess';
import { debugLibraryPermission } from '../lib/library';
import { rolePermissions } from '../lib/permissions';
import { Permission, Role, Session } from '../types/auth';
import { roleDefinitions } from '../data/content';
import { roleRank } from '../lib/roles';
import { APP_MESSAGES, friendlyUploadError, changeDone } from '../lib/appMessages';
import { inputPlaceholderColor } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { EditableIntro } from '../components/EditableIntro';
import { RoleDropdown } from '../components/RoleDropdown';
import { SectionTitle } from '../components/SectionTitle';
import { AppButton, ButtonGroup } from '../components/ui';
import { useIsDarkTheme } from '../theme/ThemeContext';
import { palette } from '../theme/palette';
import { styles } from '../theme/appStyles';

export function MaterialsScreen({ session, title, content, refreshKey, editor }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; editor?: PageEditorProps }) {
  const isDark = useIsDarkTheme();
  const [remoteMaterials, setRemoteMaterials] = useState<AppMaterialRecord[]>([]);
  const [churchDocuments, setChurchDocuments] = useState<ChurchDocumentButtonRecord[]>([]);
  const [showChurchDocumentAdmin, setShowChurchDocumentAdmin] = useState(false);
  const [churchDocumentEditingId, setChurchDocumentEditingId] = useState<string | null>(null);
  const [churchDocumentTitle, setChurchDocumentTitle] = useState('');
  const [churchDocumentLogoUrl, setChurchDocumentLogoUrl] = useState('');
  const [churchDocumentTargetUrl, setChurchDocumentTargetUrl] = useState('');
  const [churchDocumentEnabled, setChurchDocumentEnabled] = useState(true);
  const [churchDocumentSortOrder, setChurchDocumentSortOrder] = useState('1');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState<'publico' | 'desde_rango' | 'solo_rango'>('desde_rango');
  const [uploadRole, setUploadRole] = useState<Role>('sedimentador');
  const [uploadRoleDropdownOpen, setUploadRoleDropdownOpen] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [uploadFilePath, setUploadFilePath] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [materialEditTitle, setMaterialEditTitle] = useState('');
  const [materialEditDescription, setMaterialEditDescription] = useState('');
  const [materialEditVisibility, setMaterialEditVisibility] = useState<'publico' | 'desde_rango' | 'solo_rango'>('desde_rango');
  const [materialEditRole, setMaterialEditRole] = useState<Role>('sedimentador');
  const [materialEditRoleDropdownOpen, setMaterialEditRoleDropdownOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchAppMaterials(session?.role === 'administrador'), fetchChurchDocumentButtons()]).then(([items, documents]) => {
      if (alive) {
        setRemoteMaterials(items);
        setChurchDocuments(documents);
      }
    });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const visibleMaterials = remoteMaterials.length > 0
    ? remoteMaterials.map((material) => ({
      id: material.id,
      type: material.category ?? material.visibility ?? 'Material',
      title: material.title,
      description: material.description,
      permission: material.required_permission as Permission | null,
      visibility: material.visibility,
      fileUrl: material.file_url,
      filePath: material.file_path,
      createdBy: material.created_by,
      provinceId: material.province_id,
      sortOrder: material.sort_order
    })).filter((material) => canViewMaterial(material))
    : [];

  function canViewMaterial(material: { visibility?: string | null; permission?: Permission | string | null }) {
    if (material.visibility === 'publico') {
      return true;
    }
    if (!session) {
      return false;
    }
    if (session.role === 'administrador') {
      return true;
    }
    const selectedRole = material.permission?.replace('rango_', '') as Role | undefined;
    if (selectedRole && roleDefinitions.some((item) => item.role === selectedRole)) {
      if (selectedRole === 'sedimentador') {
        return roleRank(session.role) >= roleRank('sedimentador');
      }
      if (material.visibility === 'solo_rango') {
        return session.role === selectedRole;
      }
      return roleRank(session.role) >= roleRank(selectedRole);
    }
    return !material.permission || hasPermission(session, material.permission as Permission);
  }

  function canDownloadMaterial(material: { fileUrl?: string | null; filePath?: string | null }) {
    return Boolean(material.fileUrl || material.filePath);
  }

  function canManageMaterial(material: { createdBy?: string | null }) {
    return Boolean(session && (session.role === 'administrador' || material.createdBy === session.id || canManagePublishedContent(session)));
  }

  function startEditMaterial(material: typeof visibleMaterials[number]) {
    if (!('id' in material) || !material.id) {
      return;
    }
    setEditingMaterialId(material.id);
    setMaterialEditTitle(material.title);
    setMaterialEditDescription(material.description);
    setMaterialEditVisibility((material.visibility === 'publico' || material.visibility === 'solo_rango' || material.visibility === 'desde_rango') ? material.visibility : 'desde_rango');
    const selectedRole = material.permission?.replace('rango_', '') as Role | undefined;
    setMaterialEditRole(selectedRole && roleDefinitions.some((item) => item.role === selectedRole) ? selectedRole : 'sedimentador');
    setUploadMessage('');
  }

  async function saveEditedMaterial(material: typeof visibleMaterials[number]) {
    if (!('id' in material) || !material.id) {
      return;
    }
    if (!materialEditTitle.trim() || !materialEditDescription.trim()) {
      setUploadMessage('Completa titulo y descripcion.');
      return;
    }
    const { error } = await saveAppMaterial({
      id: material.id,
      title: materialEditTitle.trim(),
      description: materialEditDescription.trim(),
      category: material.type,
      visibility: materialEditVisibility,
      requiredPermission: materialEditVisibility === 'publico' ? null : `rango_${materialEditRole}`,
      fileUrl: material.fileUrl ?? null,
      filePath: material.filePath ?? null,
      sortOrder: material.sortOrder ?? 100
    });
    if (error) {
      setUploadMessage(friendlyUploadError(error.message));
      return;
    }
    setEditingMaterialId(null);
    setUploadMessage(changeDone('Material actualizado.'));
    setRemoteMaterials(await fetchAppMaterials(session?.role === 'administrador'));
  }

  async function deleteMaterial(material: typeof visibleMaterials[number]) {
    if (!('id' in material) || !material.id) {
      return;
    }
    const { error } = await archiveAppMaterial(material.id);
    if (error) {
      setUploadMessage(friendlyUploadError(error.message));
      return;
    }
    setUploadMessage(changeDone('Material eliminado.'));
    setRemoteMaterials(await fetchAppMaterials(session?.role === 'administrador'));
  }

  async function openMaterialFile(material: typeof visibleMaterials[number]) {
    if (!('fileUrl' in material) || (!material.fileUrl && !material.filePath)) {
      setUploadMessage('No se encontro el archivo de descarga.');
      return;
    }
    try {
      const targetUrl = material.fileUrl || supabase.storage.from('materials').getPublicUrl(material.filePath as string).data.publicUrl;
      const canOpen = await Linking.canOpenURL(targetUrl);
      if (!canOpen) {
        setUploadMessage('No se pudo abrir el enlace del archivo.');
        return;
      }
      await Linking.openURL(targetUrl);
    } catch {
      setUploadMessage('No se pudo descargar el archivo. Puede que ya no exista en Storage.');
    }
  }

  async function openChurchDocument(document: ChurchDocumentButtonRecord) {
    try {
      const canOpen = await Linking.canOpenURL(document.target_url);
      if (!canOpen) {
        setUploadMessage('No se pudo abrir el documento externo.');
        return;
      }
      await Linking.openURL(document.target_url);
    } catch {
      setUploadMessage('No se pudo abrir el documento externo.');
    }
  }

  async function reloadChurchDocuments(includeDisabled = false) {
    setChurchDocuments(await fetchChurchDocumentButtons(includeDisabled));
  }

  function resetChurchDocumentForm() {
    setChurchDocumentEditingId(null);
    setChurchDocumentTitle('');
    setChurchDocumentLogoUrl('');
    setChurchDocumentTargetUrl('');
    setChurchDocumentEnabled(true);
    setChurchDocumentSortOrder(String(Math.min(churchDocuments.length + 1, 6)));
  }

  function editChurchDocument(document: ChurchDocumentButtonRecord) {
    setChurchDocumentEditingId(document.id);
    setChurchDocumentTitle(document.title);
    setChurchDocumentLogoUrl(document.logo_url ?? '');
    setChurchDocumentTargetUrl(document.target_url);
    setChurchDocumentEnabled(document.enabled);
    setChurchDocumentSortOrder(String(document.sort_order ?? 1));
    setShowChurchDocumentAdmin(true);
  }

  async function uploadChurchDocumentLogoFromDownloads() {
    if (session?.role !== 'administrador') {
      setUploadMessage(APP_MESSAGES.adminOnly('subir logos'));
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setUploadMessage(APP_MESSAGES.imageSelectionPermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.82,
      allowsEditing: true,
      aspect: [1, 1]
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    try {
      setUploadMessage('Subiendo logo...');
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const bytes = await response.arrayBuffer();
      const extension = asset.uri.split('.').pop()?.split('?')[0] || 'jpg';
      const path = `church-documents/${Date.now()}.${extension.replace(/[^a-zA-Z0-9]/g, '') || 'jpg'}`;
      const { error } = await supabase.storage
        .from('materials')
        .upload(path, bytes, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
      if (error) {
        setUploadMessage(friendlyUploadError(error.message));
        return;
      }
      const { data } = supabase.storage.from('materials').getPublicUrl(path);
      setChurchDocumentLogoUrl(data.publicUrl);
      setUploadMessage('Logo cargado.');
    } catch (error) {
      setUploadMessage(friendlyUploadError(error instanceof Error ? error.message : 'No se pudo subir el logo.'));
    }
  }

  async function saveChurchDocumentFromDownloads() {
    if (session?.role !== 'administrador') {
      setUploadMessage(APP_MESSAGES.adminOnly('gestionar documentos de la Iglesia'));
      return;
    }
    if (!churchDocumentTitle.trim() || !churchDocumentTargetUrl.trim()) {
      setUploadMessage('Completa titulo y link destino.');
      return;
    }
    if (!/^https?:\/\//i.test(churchDocumentTargetUrl.trim())) {
      setUploadMessage('El link debe empezar con https://');
      return;
    }
    if (!churchDocumentEditingId && churchDocuments.length >= 6) {
      setUploadMessage('Solo se permiten hasta 6 botones.');
      return;
    }
    const { error } = await saveChurchDocumentButton({
      id: churchDocumentEditingId,
      title: churchDocumentTitle.trim(),
      logoUrl: churchDocumentLogoUrl.trim() || null,
      targetUrl: churchDocumentTargetUrl.trim(),
      enabled: churchDocumentEnabled,
      sortOrder: Number(churchDocumentSortOrder) || 1
    });
    if (error) {
      setUploadMessage(friendlyUploadError(error.message));
      return;
    }
    resetChurchDocumentForm();
    await reloadChurchDocuments(session?.role === 'administrador');
    setUploadMessage(changeDone('Boton guardado.'));
  }

  async function deleteChurchDocumentFromDownloads(id: string) {
    const { error } = await archiveChurchDocumentButton(id);
    if (error) {
      setUploadMessage(friendlyUploadError(error.message));
      return;
    }
    await reloadChurchDocuments(true);
    setUploadMessage(changeDone('Boton eliminado.'));
  }

  async function toggleChurchDocumentFromDownloads(document: ChurchDocumentButtonRecord) {
    const { error } = await saveChurchDocumentButton({
      id: document.id,
      title: document.title,
      logoUrl: document.logo_url,
      targetUrl: document.target_url,
      enabled: !document.enabled,
      sortOrder: document.sort_order
    });
    if (error) {
      setUploadMessage(friendlyUploadError(error.message));
      return;
    }
    await reloadChurchDocuments(true);
  }

  function duplicateChurchDocumentFromDownloads(document: ChurchDocumentButtonRecord) {
    setChurchDocumentEditingId(null);
    setChurchDocumentTitle(`${document.title} copia`);
    setChurchDocumentLogoUrl(document.logo_url ?? '');
    setChurchDocumentTargetUrl(document.target_url);
    setChurchDocumentEnabled(document.enabled);
    setChurchDocumentSortOrder(String(Math.min(churchDocuments.length + 1, 6)));
    setShowChurchDocumentAdmin(true);
  }

  async function uploadPdfMaterial() {
    if (!session || !canManagePublishedContent(session)) {
      setUploadMessage('Solo Vocal Diocesano en adelante puede subir contenido.');
      return;
    }
    if (!uploadTitle.trim() || !uploadDescription.trim()) {
      setUploadMessage('Completa titulo y descripcion.');
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false
    });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    const asset = result.assets[0];
    if (!asset.name.toLowerCase().endsWith('.pdf') && asset.mimeType !== 'application/pdf') {
      setUploadMessage('Solo se permiten documentos PDF.');
      return;
    }
    if ((asset.size ?? 0) > 15 * 1024 * 1024) {
      setUploadMessage('El PDF no puede pesar mas de 15Mb.');
      return;
    }
    try {
      setUploadMessage('Subiendo PDF...');
      const response = await fetch(asset.uri);
      const bytes = await response.arrayBuffer();
      const path = `${session.province}/${Date.now()}-${asset.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(path, bytes, { contentType: 'application/pdf', upsert: true });
      if (uploadError) {
        setUploadMessage(friendlyUploadError(uploadError.message));
        return;
      }
      const { data: publicUrl } = supabase.storage.from('materials').getPublicUrl(path);
      setUploadFileUrl(publicUrl.publicUrl);
      setUploadFilePath(path);
      setUploadFileName(asset.name);
      setUploadMessage('PDF cargado. Revisá los datos y tocá Finalizar subida para publicarlo.');
    } catch (error) {
      setUploadMessage(friendlyUploadError(error instanceof Error ? error.message : 'No pude subir el PDF.'));
    }
  }

  async function finalizePdfMaterialUpload() {
    if (!session || !canManagePublishedContent(session)) {
      setUploadMessage('Solo Vocal Diocesano en adelante puede publicar contenido.');
      return;
    }
    if (!uploadTitle.trim() || !uploadDescription.trim()) {
      setUploadMessage('Completa titulo y descripcion.');
      return;
    }
    if (!uploadFileUrl || !uploadFilePath) {
      setUploadMessage('Primero elegí y cargá un PDF.');
      return;
    }
    setUploadMessage('Publicando material...');
    const { error } = await saveAppMaterial({
      title: uploadTitle.trim(),
      description: uploadDescription.trim(),
      category: session.province,
      visibility: uploadVisibility,
      requiredPermission: uploadVisibility === 'publico' ? null : `rango_${uploadRole}`,
      fileUrl: uploadFileUrl,
      filePath: uploadFilePath,
      sortOrder: 100
    });
    if (error) {
      setUploadMessage(friendlyUploadError(error.message));
      return;
    }
    setUploadTitle('');
    setUploadDescription('');
    setUploadFileUrl('');
    setUploadFilePath('');
    setUploadFileName('');
    setShowUpload(false);
    setUploadMessage(changeDone('Material publicado correctamente.'));
    setRemoteMaterials(await fetchAppMaterials(session?.role === 'administrador'));
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {canManagePublishedContent(session) ? (
        <AppButton label={showUpload ? 'Cerrar carga' : 'Subir contenido'} icon={showUpload ? 'close-outline' : 'cloud-upload-outline'} onPress={() => setShowUpload(!showUpload)} />
      ) : null}
      {showUpload ? (
        <View style={[styles.inlineEditorPanel, isDark && styles.surfacePanelDark]}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Nuevo PDF</Text>
          <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Titulo" value={uploadTitle} onChangeText={setUploadTitle} placeholderTextColor={inputPlaceholderColor} />
          <TextInput style={[styles.input, styles.textArea, isDark && styles.inputDark]} placeholder="Descripcion" value={uploadDescription} onChangeText={setUploadDescription} multiline placeholderTextColor={inputPlaceholderColor} />
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Visibilidad</Text>
          <View style={styles.filterRow}>
            {[
              { key: 'publico', label: 'Todo publico' },
              { key: 'desde_rango', label: 'Desde rango y superiores' },
              { key: 'solo_rango', label: 'Solo rango seleccionado' }
            ].map((item) => (
              <TouchableOpacity key={item.key} style={[styles.filterChip, uploadVisibility === item.key && styles.filterChipActive]} onPress={() => setUploadVisibility(item.key as typeof uploadVisibility)}>
                <Text style={[styles.filterChipText, uploadVisibility === item.key && styles.filterChipTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {uploadVisibility !== 'publico' ? (
            <RoleDropdown
              label="Rango"
              value={uploadRole}
              open={uploadRoleDropdownOpen}
              onToggle={() => setUploadRoleDropdownOpen((current) => !current)}
              onSelect={setUploadRole}
            />
          ) : null}
          <AppButton label={uploadFileUrl ? 'Cambiar PDF cargado' : 'Elegir PDF max. 15Mb'} icon="document-attach-outline" variant="secondary" onPress={uploadPdfMaterial} />
          {uploadFileName ? (
            <View style={[styles.notice, isDark && styles.surfaceRowDark]}>
              <Ionicons name="checkmark-circle-outline" size={19} color={palette.red} />
              <Text style={[styles.noticeText, isDark && styles.textDarkBody]}>Archivo listo: {uploadFileName}</Text>
            </View>
          ) : null}
          <AppButton label="Finalizar subida" icon="cloud-done-outline" disabled={!uploadFileUrl} onPress={finalizePdfMaterialUpload} />
          {uploadMessage ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{uploadMessage}</Text> : null}
        </View>
      ) : null}
      <View style={[styles.card, isDark && styles.surfaceCardDark]}>
        <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Documentos de la Iglesia</Text>
        <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Textos oficiales y recursos externos seleccionados.</Text>
        {session?.role === 'administrador' ? (
          <AppButton
            label={showChurchDocumentAdmin ? 'Cerrar editor' : 'Agregar boton'}
            icon={showChurchDocumentAdmin ? 'close-outline' : 'add-circle-outline'}
            onPress={() => {
              setShowChurchDocumentAdmin((current) => !current);
              reloadChurchDocuments(true);
            }}
          />
        ) : null}
        {showChurchDocumentAdmin && session?.role === 'administrador' ? (
          <View style={[styles.inlineEditorPanel, isDark && styles.surfacePanelDark]}>
            <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{churchDocumentEditingId ? 'Editar boton' : 'Nuevo boton'}</Text>
            <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Titulo visible" value={churchDocumentTitle} onChangeText={setChurchDocumentTitle} placeholderTextColor={inputPlaceholderColor} />
            <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Link destino https://..." value={churchDocumentTargetUrl} onChangeText={setChurchDocumentTargetUrl} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />
            <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Logo URL o subir imagen" value={churchDocumentLogoUrl} onChangeText={setChurchDocumentLogoUrl} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />
            <AppButton label="Subir logo/imagen" icon="image-outline" variant="secondary" size="compact" onPress={uploadChurchDocumentLogoFromDownloads} />
            <View style={styles.inlineActions}>
              <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Orden" value={churchDocumentSortOrder} onChangeText={setChurchDocumentSortOrder} keyboardType="numeric" placeholderTextColor={inputPlaceholderColor} />
              <TouchableOpacity style={[styles.actionPill, churchDocumentEnabled && styles.actionPillActive]} onPress={() => setChurchDocumentEnabled((current) => !current)}>
                <Text style={[styles.actionPillText, churchDocumentEnabled && styles.actionPillTextActive]}>{churchDocumentEnabled ? 'Habilitado' : 'Deshabilitado'}</Text>
              </TouchableOpacity>
            </View>
            <ButtonGroup>
              <AppButton label={churchDocumentEditingId ? 'Guardar boton' : 'Crear boton'} icon="save-outline" size="compact" onPress={saveChurchDocumentFromDownloads} />
              <AppButton label="Limpiar" icon="refresh-outline" variant="ghost" size="compact" onPress={resetChurchDocumentForm} />
            </ButtonGroup>
            {churchDocuments.map((document) => (
              <View key={document.id} style={[styles.adminListRow, isDark && styles.surfaceRowDark, !document.enabled && styles.lockedCard]}>
                {document.logo_url ? <Image source={{ uri: document.logo_url }} style={styles.adminDocumentThumb} /> : <View style={styles.adminDocumentThumb}><Ionicons name="key-outline" size={18} color={palette.red} /></View>}
                <View style={styles.adminUserHeaderText}>
                  <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{document.title}</Text>
                  <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Orden {document.sort_order} - {document.enabled ? 'activo' : 'inactivo'}</Text>
                </View>
                <ButtonGroup>
                  <AppButton label="Editar" icon="create-outline" variant="ghost" size="compact" onPress={() => editChurchDocument(document)} />
                  <AppButton label="Duplicar" icon="copy-outline" variant="ghost" size="compact" onPress={() => duplicateChurchDocumentFromDownloads(document)} />
                  <AppButton label={document.enabled ? 'Ocultar' : 'Activar'} icon={document.enabled ? 'eye-off-outline' : 'eye-outline'} variant="secondary" size="compact" onPress={() => toggleChurchDocumentFromDownloads(document)} />
                  <AppButton label="Borrar" icon="trash-outline" variant="dangerGhost" size="compact" onPress={() => deleteChurchDocumentFromDownloads(document.id)} />
                </ButtonGroup>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.churchDocumentGrid}>
          {churchDocuments.filter((document) => document.enabled).slice(0, 6).map((document) => (
            <TouchableOpacity key={document.id} style={[styles.churchDocumentButton, isDark && styles.surfaceRowDark]} onPress={() => openChurchDocument(document)} activeOpacity={0.86}>
              {document.logo_url ? <Image source={{ uri: document.logo_url }} style={styles.churchDocumentLogo} /> : <View style={styles.churchDocumentLogoFallback}><Ionicons name="key-outline" size={22} color={palette.red} /></View>}
              <Text style={[styles.churchDocumentTitle, isDark && styles.textDarkStrong]} numberOfLines={2}>{document.title}</Text>
            </TouchableOpacity>
          ))}
          {churchDocuments.filter((document) => document.enabled).length === 0 ? (
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Todavia no hay documentos de la Iglesia cargados.</Text>
          ) : null}
        </View>
      </View>
      {visibleMaterials.length === 0 ? (
        <View style={[styles.card, isDark && styles.surfaceCardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>No existen archivos actualmente</Text>
        </View>
      ) : null}
      {visibleMaterials.map((material, index) => {
        const locked = !canViewMaterial(material);
        const canEditThisMaterial = 'id' in material && canManageMaterial(material);
        const isEditingThisMaterial = 'id' in material && editingMaterialId === material.id;
        return (
          <View key={`${material.title}-${index}`} style={[styles.card, styles.libraryCard, isDark && styles.libraryCardDark, locked && styles.lockedCard]}>
            <View style={styles.libraryIcon}>
              <Ionicons name={locked ? 'lock-closed-outline' : 'document-text-outline'} size={24} color={locked ? palette.inkMuted : palette.red} />
            </View>
            <View style={styles.libraryBody}>
              {isEditingThisMaterial ? (
                <View style={[styles.profileCommunityPanel, isDark && styles.surfacePanelDark]}>
                  <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Editar material</Text>
                  <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Titulo" value={materialEditTitle} onChangeText={setMaterialEditTitle} placeholderTextColor={inputPlaceholderColor} />
                  <TextInput style={[styles.input, styles.textArea, isDark && styles.inputDark]} placeholder="Descripcion" value={materialEditDescription} onChangeText={setMaterialEditDescription} multiline placeholderTextColor={inputPlaceholderColor} />
                  <View style={styles.filterRow}>
                    {[
                      { key: 'publico', label: 'Todo publico' },
                      { key: 'desde_rango', label: 'Desde rango' },
                      { key: 'solo_rango', label: 'Solo rango' }
                    ].map((item) => (
                      <TouchableOpacity key={item.key} style={[styles.filterChip, materialEditVisibility === item.key && styles.filterChipActive]} onPress={() => setMaterialEditVisibility(item.key as typeof materialEditVisibility)}>
                        <Text style={[styles.filterChipText, materialEditVisibility === item.key && styles.filterChipTextActive]}>{item.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {materialEditVisibility !== 'publico' ? (
                    <RoleDropdown
                      label="Rango"
                      value={materialEditRole}
                      open={materialEditRoleDropdownOpen}
                      onToggle={() => setMaterialEditRoleDropdownOpen((current) => !current)}
                      onSelect={setMaterialEditRole}
                    />
                  ) : null}
                  <ButtonGroup>
                    <AppButton label="Guardar cambios" icon="save-outline" size="compact" onPress={() => saveEditedMaterial(material)} />
                    <AppButton label="Cancelar" variant="ghost" size="compact" onPress={() => setEditingMaterialId(null)} />
                  </ButtonGroup>
                </View>
              ) : (
                <>
                  <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{material.type}</Text>
                  <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{material.title}</Text>
                  <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{locked ? 'Material restringido por rango o permiso.' : material.description}</Text>
                  {locked ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Requiere permiso: {material.permission}</Text> : null}
                  {!locked ? (
                    <AppButton
                      label={canDownloadMaterial(material) ? 'Descargar documento' : 'Archivo no disponible'}
                      icon="download-outline"
                      variant="secondary"
                      size="compact"
                      disabled={!canDownloadMaterial(material)}
                      onPress={() => openMaterialFile(material)}
                    />
                  ) : null}
                  {canEditThisMaterial ? (
                    <ButtonGroup>
                      <AppButton label="Editar" icon="create-outline" variant="ghost" size="compact" onPress={() => startEditMaterial(material)} />
                      <AppButton label="Eliminar" icon="trash-outline" variant="dangerGhost" size="compact" onPress={() => deleteMaterial(material)} />
                    </ButtonGroup>
                  ) : null}
                </>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
