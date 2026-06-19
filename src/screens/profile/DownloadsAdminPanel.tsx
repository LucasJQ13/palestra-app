import React from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppMaterialRecord, ChurchDocumentButtonRecord } from '../../lib/profiles';
import { inputPlaceholderColor } from '../../lib/constants';
import { APP_MESSAGES } from '../../lib/appMessages';
import { Role } from '../../types/auth';
import { palette } from '../../theme/palette';
import { styles } from '../../theme/appStyles';
import { AppButton, ButtonGroup, IconButton } from '../../components/ui';

type FallbackMaterial = {
  readonly type: string;
  readonly title: string;
  readonly description: string;
  readonly permission: string | null;
};

type DownloadsAdminPanelProps = {
  isDark: boolean;
  sessionRole: Role | null;
  adminChurchDocuments: ChurchDocumentButtonRecord[];
  adminMaterials: AppMaterialRecord[];
  fallbackMaterials: readonly FallbackMaterial[];
  churchDocumentEditingId: string | null;
  churchDocumentTitle: string;
  churchDocumentTargetUrl: string;
  churchDocumentLogoUrl: string;
  churchDocumentSortOrder: string;
  churchDocumentEnabled: boolean;
  materialTitle: string;
  materialCategory: string;
  materialFileUrl: string;
  materialDescription: string;
  materialVisibility: string | null;
  materialPermission: string;
  onLoadMaterials: () => void;
  onEditChurchDocument: (document: ChurchDocumentButtonRecord) => void;
  onMoveChurchDocument: (document: ChurchDocumentButtonRecord, direction: -1 | 1) => void;
  onDuplicateChurchDocument: (document: ChurchDocumentButtonRecord) => void;
  onToggleChurchDocument: (document: ChurchDocumentButtonRecord) => void;
  onDeleteChurchDocument: (id: string) => void;
  onUploadChurchDocumentLogo: () => void;
  onSaveChurchDocumentDraft: () => void;
  onResetChurchDocumentForm: () => void;
  setChurchDocumentTitle: (value: string) => void;
  setChurchDocumentTargetUrl: (value: string) => void;
  setChurchDocumentLogoUrl: (value: string) => void;
  setChurchDocumentSortOrder: (value: string) => void;
  setChurchDocumentEnabled: (value: boolean) => void;
  setMaterialTitle: (value: string) => void;
  setMaterialCategory: (value: string) => void;
  setMaterialFileUrl: (value: string) => void;
  setMaterialDescription: (value: string) => void;
  setMaterialVisibility: (value: string) => void;
  setMaterialPermission: (value: string) => void;
  onArchiveMaterial: (id: string) => void;
  onSaveMaterial: () => void;
};

export function DownloadsAdminPanel({
  isDark,
  sessionRole,
  adminChurchDocuments,
  adminMaterials,
  fallbackMaterials,
  churchDocumentEditingId,
  churchDocumentTitle,
  churchDocumentTargetUrl,
  churchDocumentLogoUrl,
  churchDocumentSortOrder,
  churchDocumentEnabled,
  materialTitle,
  materialCategory,
  materialFileUrl,
  materialDescription,
  materialVisibility,
  materialPermission,
  onLoadMaterials,
  onEditChurchDocument,
  onMoveChurchDocument,
  onDuplicateChurchDocument,
  onToggleChurchDocument,
  onDeleteChurchDocument,
  onUploadChurchDocumentLogo,
  onSaveChurchDocumentDraft,
  onResetChurchDocumentForm,
  setChurchDocumentTitle,
  setChurchDocumentTargetUrl,
  setChurchDocumentLogoUrl,
  setChurchDocumentSortOrder,
  setChurchDocumentEnabled,
  setMaterialTitle,
  setMaterialCategory,
  setMaterialFileUrl,
  setMaterialDescription,
  setMaterialVisibility,
  setMaterialPermission,
  onArchiveMaterial,
  onSaveMaterial
}: DownloadsAdminPanelProps) {
  const materialRows = adminMaterials.length > 0 ? adminMaterials : fallbackMaterials.map((material, index) => ({
    id: `fallback-${index}`,
    title: material.title,
    description: material.description,
    category: material.type,
    visibility: material.permission ? 'interno' : 'publico',
    required_permission: material.permission,
    file_url: null,
    file_path: null,
    sort_order: index,
    archived_at: null,
    created_at: null,
    created_by: null,
    province_id: null
  } as AppMaterialRecord));

  return (
    <View style={[styles.adminWorkspace, isDark && styles.adminWorkspaceDark]}>
      <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{APP_MESSAGES.adminPanels.downloads.title}</Text>
      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.adminPanels.downloads.help}</Text>
      <AppButton label={APP_MESSAGES.adminPanels.downloads.load} icon="refresh-outline" variant="secondary" onPress={onLoadMaterials} />
      {sessionRole === 'administrador' ? (
        <View style={[styles.inlineEditorPanel, isDark && styles.surfacePanelDark]}>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.downloads.churchDocuments}</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.adminPanels.downloads.churchDocumentsHelp}</Text>
          <View style={styles.adminQuickGrid}>
            {adminChurchDocuments.map((document) => (
              <View key={document.id} style={[styles.adminListRow, isDark && styles.surfaceRowDark, !document.enabled && styles.lockedCard]}>
                {document.logo_url ? <Image source={{ uri: document.logo_url }} style={styles.adminDocumentThumb} /> : <View style={styles.adminDocumentThumb}><Ionicons name="key-outline" size={18} color={palette.red} /></View>}
                <View style={styles.adminUserHeaderText}>
                  <Text style={[styles.adminQuickText, isDark && styles.textDarkStrong]}>{document.title}</Text>
                  <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Orden {document.sort_order} - {document.enabled ? 'activo' : 'inactivo'}</Text>
                </View>
                <ButtonGroup>
                  <AppButton label="Editar" icon="create-outline" variant="ghost" size="compact" onPress={() => onEditChurchDocument(document)} />
                  <IconButton icon="arrow-up-outline" variant="ghost" size="sm" accessibilityLabel={`Subir ${document.title}`} onPress={() => onMoveChurchDocument(document, -1)} />
                  <IconButton icon="arrow-down-outline" variant="ghost" size="sm" accessibilityLabel={`Bajar ${document.title}`} onPress={() => onMoveChurchDocument(document, 1)} />
                  <AppButton label="Duplicar" icon="copy-outline" variant="ghost" size="compact" onPress={() => onDuplicateChurchDocument(document)} />
                  <AppButton label={document.enabled ? 'Ocultar' : 'Activar'} icon={document.enabled ? 'eye-off-outline' : 'eye-outline'} variant="secondary" size="compact" onPress={() => onToggleChurchDocument(document)} />
                  <AppButton label="Borrar" icon="trash-outline" variant="dangerGhost" size="compact" onPress={() => onDeleteChurchDocument(document.id)} />
                </ButtonGroup>
              </View>
            ))}
            {adminChurchDocuments.length === 0 ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.adminPanels.downloads.emptyChurchDocuments}</Text> : null}
          </View>
          <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{churchDocumentEditingId ? APP_MESSAGES.adminPanels.downloads.editButton : APP_MESSAGES.adminPanels.downloads.addButton}</Text>
          <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Titulo visible" value={churchDocumentTitle} onChangeText={setChurchDocumentTitle} placeholderTextColor={inputPlaceholderColor} />
          <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Link destino https://..." value={churchDocumentTargetUrl} onChangeText={setChurchDocumentTargetUrl} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />
          <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Logo URL o subir imagen" value={churchDocumentLogoUrl} onChangeText={setChurchDocumentLogoUrl} autoCapitalize="none" placeholderTextColor={inputPlaceholderColor} />
          <AppButton label="Subir logo/imagen" icon="image-outline" variant="secondary" size="compact" onPress={onUploadChurchDocumentLogo} />
          <View style={styles.inlineActions}>
            <TextInput style={[styles.input, styles.colorInput, isDark && styles.inputDark]} placeholder="Orden" value={churchDocumentSortOrder} onChangeText={setChurchDocumentSortOrder} keyboardType="numeric" placeholderTextColor={inputPlaceholderColor} />
            <TouchableOpacity style={[styles.actionPill, churchDocumentEnabled && styles.actionPillActive]} onPress={() => setChurchDocumentEnabled(!churchDocumentEnabled)}>
              <Text style={[styles.actionPillText, churchDocumentEnabled && styles.actionPillTextActive]}>{churchDocumentEnabled ? 'Habilitado' : 'Deshabilitado'}</Text>
            </TouchableOpacity>
          </View>
          <ButtonGroup>
            <AppButton label={churchDocumentEditingId ? APP_MESSAGES.adminPanels.downloads.saveButton : APP_MESSAGES.adminPanels.downloads.addButton} icon="save-outline" onPress={onSaveChurchDocumentDraft} />
            <AppButton label={APP_MESSAGES.adminPanels.downloads.clear} icon="close-outline" variant="ghost" onPress={onResetChurchDocumentForm} />
          </ButtonGroup>
        </View>
      ) : null}
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.downloads.currentMaterials}</Text>
      {materialRows.length === 0 ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.adminPanels.downloads.materialEmpty}</Text> : null}
      {materialRows.map((material) => (
        <View key={material.id} style={[styles.adminListRow, isDark && styles.surfaceRowDark]}>
          <Ionicons name="document-text-outline" size={19} color={palette.red} />
          <View style={styles.adminUserHeaderText}>
            <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{material.title}</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{material.category ?? 'General'} - {material.visibility ?? 'interno'}{material.required_permission ? ` - ${material.required_permission}` : ''}</Text>
          </View>
          {!material.id.startsWith('fallback-') ? (
            <AppButton label="Archivar" icon="archive-outline" variant="dangerGhost" size="compact" onPress={() => onArchiveMaterial(material.id)} />
          ) : <Text style={styles.adminStateDraft}>Base</Text>}
        </View>
      ))}
      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.adminPanels.downloads.newMaterial}</Text>
      <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Nombre del archivo" value={materialTitle} onChangeText={setMaterialTitle}  placeholderTextColor={inputPlaceholderColor} />
      <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Categoria" value={materialCategory} onChangeText={setMaterialCategory} placeholderTextColor={inputPlaceholderColor} />
      <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="URL del archivo o PDF" value={materialFileUrl} onChangeText={setMaterialFileUrl}  placeholderTextColor={inputPlaceholderColor} />
      <TextInput style={[styles.input, styles.textArea, isDark && styles.inputDark]} placeholder="descripcion" value={materialDescription} onChangeText={setMaterialDescription} multiline  placeholderTextColor={inputPlaceholderColor} />
      <View style={styles.filterRow}>
        {['publico', 'interno', 'reservado', 'administrador'].map((item, index) => (
          <TouchableOpacity key={`${item}-${index}`} style={[styles.filterChip, isDark && styles.surfaceRowDark, materialVisibility === item && styles.filterChipActive]} onPress={() => setMaterialVisibility(item)}>
            <Text style={[styles.filterChipText, isDark && styles.textDarkStrong, materialVisibility === item && styles.filterChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={[styles.input, isDark && styles.inputDark]} placeholder="Permiso requerido opcional. Ej: ver_materiales_internos" value={materialPermission} onChangeText={setMaterialPermission}  placeholderTextColor={inputPlaceholderColor} />
      <AppButton label={APP_MESSAGES.adminPanels.downloads.saveMaterial} icon="save-outline" onPress={onSaveMaterial} />
    </View>
  );
}
