import { StyleSheet } from 'react-native';
import { palette } from './palette';
import { themePresets } from './themes';
import { designTokens as ui } from './designTokens';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ui.color.appBackground
  },
  safeAreaDark: {
    backgroundColor: themePresets.dark.colors.background
  },
  authFullscreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 140,
    backgroundColor: '#081923',
    overflow: 'hidden'
  },
  authGlowOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -94,
    top: -58,
    backgroundColor: 'rgba(45, 141, 200, 0.38)'
  },
  authGlowTwo: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    left: -86,
    bottom: -70,
    backgroundColor: 'rgba(242, 184, 75, 0.18)'
  },
  authCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 4,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)'
  },
  authKeyboardAvoider: {
    flex: 1,
    width: '100%'
  },
  authScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 96,
    justifyContent: 'center'
  },
  authWizardScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 76,
    paddingBottom: 116,
    justifyContent: 'flex-start'
  },
  authBrandHeader: {
    alignItems: 'flex-start',
    marginBottom: 34
  },
  authLogo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginBottom: 16,
    backgroundColor: palette.white
  },
  authBrandTitle: {
    color: palette.white,
    fontSize: 27,
    fontWeight: '900'
  },
  authBrandSubtitle: {
    color: 'rgba(230, 243, 245, 0.72)',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3
  },
  authHeroTitle: {
    color: palette.white,
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    marginBottom: 12
  },
  authHeroText: {
    color: 'rgba(230, 243, 245, 0.78)',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
    marginBottom: 24
  },
  authFormPanel: {
    gap: 16,
    marginTop: 12
  },
  authInputLabel: {
    color: 'rgba(230, 243, 245, 0.82)',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0
  },
  authInput: {
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 16,
    color: palette.white,
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(230,243,245,0.16)'
  },
  authPasswordWrap: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(230,243,245,0.16)',
    flexDirection: 'row',
    alignItems: 'center'
  },
  authInputPassword: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 16,
    color: palette.white,
    fontSize: 16,
    fontWeight: '700'
  },
  authEyeButton: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center'
  },
  authPrimaryButton: {
    minHeight: 58,
    borderRadius: 21,
    backgroundColor: '#2d8dc8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    shadowColor: '#2d8dc8',
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 4
  },
  authPrimaryText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '900'
  },
  authGhostButton: {
    minHeight: 54,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230,243,245,0.24)',
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  authGhostText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '900'
  },
  authLinkText: {
    color: '#9FD8E8',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  },
  authMessage: {
    color: '#E6F3F5',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  authWizardShell: {
    width: '100%',
    minHeight: 520,
    justifyContent: 'space-between',
    gap: 16
  },
  authWizardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  authBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)'
  },
  authBackText: {
    color: palette.white,
    fontWeight: '900',
    fontSize: 12
  },
  authProgressText: {
    color: 'rgba(230,243,245,0.72)',
    fontSize: 12,
    fontWeight: '900'
  },
  authWizardCard: {
    justifyContent: 'center',
    minHeight: 300
  },
  authStepContent: {
    gap: 15
  },
  authStepDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7
  },
  authStepDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(230,243,245,0.28)'
  },
  authStepDotActive: {
    width: 24,
    backgroundColor: '#2d8dc8'
  },
  authSelectButton: {
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(230,243,245,0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  authSelectText: {
    flex: 1,
    color: palette.white,
    fontSize: 15,
    fontWeight: '800'
  },
  authSelectList: {
    maxHeight: 170,
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(230,243,245,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(230,243,245,0.14)'
  },
  authSelectItem: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230,243,245,0.08)'
  },
  authSelectItemText: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '800'
  },
  authNarrativeCard: {
    minHeight: 150,
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(230,243,245,0.15)'
  },
  authNarrativeCardActive: {
    backgroundColor: '#2d8dc8',
    borderColor: '#2d8dc8'
  },
  authNarrativeTextBlock: {
    flex: 1
  },
  authNarrativeTitle: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '900'
  },
  authNarrativeTitleActive: {
    color: palette.white
  },
  authNarrativeText: {
    color: 'rgba(230,243,245,0.72)',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3
  },
  authNarrativeTextActive: {
    color: 'rgba(255,255,255,0.86)'
  },
  birthCalendar: {
    marginTop: 10,
    borderRadius: 22,
    padding: 14,
    height: 342,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(230,243,245,0.14)'
  },
  birthCalendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  birthCalendarTitleGroup: {
    alignItems: 'center',
    gap: 2
  },
  birthCalendarTitle: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'capitalize'
  },
  birthCalendarYear: {
    color: 'rgba(230,243,245,0.72)',
    fontSize: 12,
    fontWeight: '900'
  },
  birthCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  birthPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10
  },
  birthPickerCell: {
    width: '22.9%',
    minHeight: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)'
  },
  birthWeekday: {
    width: '14.285%',
    textAlign: 'center',
    color: 'rgba(230,243,245,0.62)',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 7
  },
  birthDay: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12
  },
  birthDaySelected: {
    backgroundColor: '#2d8dc8'
  },
  birthDayText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '800'
  },
  birthDayTextSelected: {
    color: palette.white,
    fontWeight: '900'
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: ui.color.appBackground,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34
  },
  loadingFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: ui.color.surface
  },
  loadingLogoFrame: {
    width: 118,
    height: 118,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: ui.color.borderStrong,
    backgroundColor: ui.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...ui.shadow.raised
  },
  loadingLogo: {
    width: '100%',
    height: '100%'
  },
  loadingTitle: {
    color: palette.ink,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 22
  },
  loadingSubtitle: {
    color: palette.inkMuted,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4
  },
  loadingBarTrack: {
    width: 220,
    height: 5,
    borderRadius: ui.radius.pill,
    backgroundColor: ui.color.surfaceMuted,
    overflow: 'hidden',
    marginTop: 28
  },
  loadingBarPulse: {
    width: 92,
    height: 5,
    borderRadius: ui.radius.pill,
    backgroundColor: palette.red
  },
  designerCreditLoading: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 26,
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center'
  },
  designerCreditHome: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 4
  },
  designerCreditHomeText: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center'
  },
  tapCircle: {
    position: 'absolute',
    zIndex: 120,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(31, 159, 209, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)'
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: ui.color.border,
    backgroundColor: ui.color.appBackgroundTint,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerDark: {
    backgroundColor: themePresets.dark.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: themePresets.dark.colors.border
  },
  runtimeBanner: {
    backgroundColor: palette.red,
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  runtimeBannerWarning: {
    backgroundColor: '#9D3B31'
  },
  runtimeBannerText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '900',
    flex: 1
  },
  brandBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0
  },
  brandTextBlock: {
    flex: 1,
    minWidth: 0
  },
  brandLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: ui.color.borderStrong,
    backgroundColor: ui.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...ui.shadow.soft
  },
  brandLogoImage: {
    width: '100%',
    height: '100%'
  },
  brand: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '800'
  },
  brandDark: {
    color: themePresets.dark.colors.text
  },
  subtitle: {
    color: palette.inkMuted,
    fontSize: 13,
    marginTop: 2
  },
  subtitleDark: {
    color: themePresets.dark.colors.muted
  },
  versionBadge: {
    color: palette.red,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
    textTransform: 'uppercase'
  },
  appToast: {
    position: 'absolute',
    top: 86,
    left: 18,
    right: 18,
    zIndex: 80,
    backgroundColor: palette.ink,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5
  },
  appToastText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  },
  themeTransitionLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 130,
    overflow: 'hidden'
  },
  themePaintSplash: {
    position: 'absolute',
    top: 54,
    right: 34,
    width: 86,
    height: 86,
    borderRadius: 43
  },
  themePaintDrop: {
    position: 'absolute',
    borderRadius: 999
  },
  themePaintDropOne: {
    top: 122,
    right: 86,
    width: 32,
    height: 32
  },
  themePaintDropTwo: {
    top: 38,
    right: 142,
    width: 22,
    height: 22
  },
  successToastOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12, 25, 38, 0.18)'
  },
  successToastCard: {
    minHeight: 58,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: 'rgba(45, 141, 200, 0.92)',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8
  },
  successToastText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '900'
  },
  mailboxFloatingNotice: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    zIndex: 95,
    maxWidth: 238,
    minHeight: 62,
    borderRadius: 22,
    padding: 8,
    paddingRight: 42,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.22)',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8
  },
  mailboxFloatingNoticeDark: {
    backgroundColor: themePresets.dark.colors.surface,
    borderColor: 'rgba(229, 240, 244, 0.14)'
  },
  mailboxFloatingMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minWidth: 152
  },
  mailboxFloatingIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center'
  },
  mailboxFloatingTextBlock: {
    flex: 1,
    minWidth: 0
  },
  mailboxFloatingTitle: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '900'
  },
  mailboxFloatingMeta: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2
  },
  mailboxFloatingClose: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.08)'
  },
  viewAsBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: palette.blueDeep,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  viewAsBannerText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '900',
    flex: 1
  },
  viewAsExitButton: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.16)'
  },
  viewAsExitText: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '900'
  },
  inlineInfoPanel: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(45, 141, 200, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  maintenancePanel: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2
  },
  maintenanceTitle: {
    color: palette.ink,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center'
  },
  maintenanceText: {
    color: palette.ink,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    fontWeight: '700'
  },
  sessionBadge: {
    backgroundColor: 'rgba(45, 141, 200, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    maxWidth: 150
  },
  sessionBadgeText: {
    color: palette.blueDeep,
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1
  },
  headerStatusColumn: {
    alignItems: 'flex-end',
    gap: 4,
    maxWidth: 156
  },
  headerDateTime: {
    color: palette.inkMuted,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 13
  },
  headerActions: {
    alignItems: 'stretch',
    gap: 4,
    flexShrink: 1
  },
  headerActionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8
  },
  headerProfileButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: ui.radius.md,
    backgroundColor: ui.color.surface,
    borderWidth: 1,
    borderColor: ui.color.border
  },
  headerProfileButtonText: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '900'
  },
  headerMenuButton: {
    width: 36,
    height: 36,
    borderRadius: ui.radius.md,
    backgroundColor: ui.color.surface,
    borderWidth: 1,
    borderColor: ui.color.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 25, 38, 0.34)',
    flexDirection: 'row'
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  drawerPanel: {
    height: '100%',
    backgroundColor: ui.color.surfaceSoft,
    borderTopRightRadius: ui.radius.xl,
    borderBottomRightRadius: ui.radius.xl,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 20,
    ...ui.shadow.modal
  },
  drawerPanelDark: {
    backgroundColor: themePresets.dark.colors.surface,
    shadowColor: '#000'
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: ui.color.border
  },
  drawerLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)'
  },
  headerPillDark: {
    backgroundColor: themePresets.dark.colors.surface,
    borderColor: themePresets.dark.colors.border
  },
  drawerHeaderText: {
    flex: 1,
    minWidth: 0
  },
  drawerTitle: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '900'
  },
  drawerTitleDark: {
    color: themePresets.dark.colors.text
  },
  drawerSubtitle: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2
  },
  drawerSubtitleDark: {
    color: themePresets.dark.colors.muted
  },
  drawerCloseButton: {
    width: 36,
    height: 36,
    borderRadius: ui.radius.md,
    backgroundColor: ui.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ui.color.border
  },
  drawerCloseButtonDark: {
    backgroundColor: themePresets.dark.colors.surfaceSoft,
    borderColor: themePresets.dark.colors.border
  },
  drawerScroll: {
    marginTop: 8
  },
  drawerScrollContent: {
    gap: 8,
    paddingBottom: 28
  },
  drawerItem: {
    minHeight: 54,
    borderRadius: ui.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  drawerItemDark: {
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  drawerItemActive: {
    backgroundColor: ui.color.primarySoft
  },
  drawerItemActiveDark: {
    backgroundColor: 'rgba(93, 167, 219, 0.18)'
  },
  drawerIconFrame: {
    width: 38,
    height: 38,
    borderRadius: ui.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.09)'
  },
  drawerIconFrameDark: {
    backgroundColor: 'rgba(93, 167, 219, 0.14)'
  },
  drawerIconFrameActive: {
    backgroundColor: palette.red
  },
  drawerItemTextBlock: {
    flex: 1,
    minWidth: 0
  },
  drawerItemText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  drawerItemTextDark: {
    color: themePresets.dark.colors.text
  },
  drawerItemTextActive: {
    color: palette.red
  },
  drawerItemMeta: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2
  },
  drawerSectionLabel: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 2
  },
  drawerActiveMark: {
    width: 4,
    height: 24,
    borderRadius: ui.radius.pill
  },
  drawerItemMetaDark: {
    color: themePresets.dark.colors.muted
  },
  narrativeEditCard: {
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(45, 141, 200, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)'
  },
  narrativeEditCardActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  narrativeEditTextBlock: {
    flex: 1,
    minWidth: 0
  },
  narrativeEditTitle: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '900'
  },
  narrativeEditTitleActive: {
    color: palette.white
  },
  narrativeEditText: {
    color: palette.inkMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 4
  },
  narrativeEditTextActive: {
    color: 'rgba(255,255,255,0.86)'
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 48
  },
  contentDark: {
    backgroundColor: themePresets.dark.colors.background
  },
  contentKeyboardAvoider: {
    flex: 1
  },
  surfacePanelDark: {
    backgroundColor: ui.color.darkSurface,
    borderColor: ui.color.darkBorder,
    shadowColor: '#000'
  },
  surfaceCardDark: {
    backgroundColor: ui.color.darkSurfaceSoft,
    borderColor: ui.color.darkBorder,
    shadowColor: '#000'
  },
  surfaceRowDark: {
    backgroundColor: 'rgba(168, 221, 243, 0.08)',
    borderColor: themePresets.dark.colors.border
  },
  darkSoftButton: {
    backgroundColor: themePresets.dark.colors.surfaceSoft,
    borderColor: 'rgba(139, 201, 234, 0.34)'
  },
  textDarkStrong: {
    color: themePresets.dark.colors.text
  },
  textDarkBody: {
    color: '#E5F0F4'
  },
  textDarkMuted: {
    color: themePresets.dark.colors.muted
  },
  textDarkAccent: {
    color: themePresets.dark.colors.secondary
  },
  stack: {
    gap: 18
  },
  stackTight: {
    gap: 10
  },
  stackSmall: {
    gap: 10
  },
  hero: {
    backgroundColor: ui.color.surface,
    borderRadius: ui.radius.xl,
    borderWidth: 1,
    borderColor: ui.color.border,
    padding: 22,
    overflow: 'hidden',
    ...ui.shadow.soft,
    marginBottom: 2
  },
  heroGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: ui.color.appBackgroundTint,
    opacity: 0.86,
    right: -42,
    top: -54
  },
  kicker: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  heroTitle: {
    color: palette.ink,
    fontSize: 29,
    fontWeight: '900',
    lineHeight: 35,
    marginTop: 8,
    maxWidth: '92%'
  },
  heroGreetingName: {
    color: '#56D486',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  heroText: {
    color: palette.inkMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: '94%'
  },
  homeHeroFooter: {
    marginTop: 18,
    gap: 10
  },
  homeHeroStatus: {
    alignSelf: 'flex-start',
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: ui.radius.pill,
    backgroundColor: ui.color.primarySoft,
    borderWidth: 1,
    borderColor: ui.color.borderStrong
  },
  homeHeroStatusText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '900'
  },
  homeHeroMeta: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '800'
  },
  homeQuickPanel: {
    backgroundColor: ui.color.surface,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    padding: 8,
    ...ui.shadow.none
  },
  homeTileGrid: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
    gap: 7,
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0
  },
  homeTile: {
    width: '100%',
    minHeight: 62,
    borderRadius: ui.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: ui.color.surfaceSoft,
    borderWidth: 1,
    borderColor: ui.color.border
  },
  homeTilePrimary: {
    backgroundColor: 'transparent'
  },
  homeTileSky: {
    backgroundColor: 'transparent'
  },
  homeTileWarm: {
    backgroundColor: 'transparent'
  },
  homeTileDeep: {
    backgroundColor: 'transparent'
  },
  homeTileIcon: {
    width: 42,
    height: 42,
    borderRadius: ui.radius.sm,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...ui.shadow.none
  },
  homeTileCopy: {
    flex: 1,
    minWidth: 0
  },
  homeTileTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'left'
  },
  homeTileMeta: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'left',
    lineHeight: 15
  },
  dashboardStrip: {
    flexDirection: 'row',
    gap: 10
  },
  instagramButton: {
    minHeight: 72,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#C13584',
    shadowColor: '#C13584',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3
  },
  gospelButton: {
    minHeight: 72,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f28a00',
    shadowColor: '#f28a00',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3
  },
  gospelModalPanel: {
    maxHeight: '88%',
    overflow: 'hidden'
  },
  gospelModalScroll: {
    width: '100%',
    flexShrink: 1
  },
  gospelModalContent: {
    gap: 12,
    paddingBottom: 32,
    paddingRight: 2
  },
  gospelText: {
    fontSize: 16,
    lineHeight: 25
  },
  gospelReflectionPanel: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    backgroundColor: palette.white,
    padding: 14,
    gap: 8
  },
  instagramButtonText: {
    flex: 1
  },
  instagramButtonTitle: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '900'
  },
  instagramButtonMeta: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    fontWeight: '700'
  },
  dashboardStat: {
    flex: 1,
    minHeight: 102,
    borderRadius: ui.radius.md,
    padding: 14,
    backgroundColor: ui.color.surface,
    borderWidth: 1,
    borderColor: ui.color.border,
    justifyContent: 'space-between',
    ...ui.shadow.none
  },
  dashboardValue: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6
  },
  dashboardLabel: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '800'
  },
  featurePanel: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    gap: 12,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  featurePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12
  },
  miniEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.white,
    borderRadius: 22,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.1)',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 1
  },
  miniEventDate: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center'
  },
  miniEventDay: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '900'
  },
  miniEventMonth: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  miniEventBody: {
    flex: 1
  },
  miniEventTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  miniEventScope: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: ui.font.title,
    fontWeight: '900',
    marginTop: 6,
    marginBottom: 2
  },
  sectionTitleDark: {
    color: themePresets.dark.colors.text
  },
  card: {
    backgroundColor: ui.color.surface,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    padding: ui.space.lg,
    ...ui.shadow.none
  },
  feedCard: {
    gap: 10,
    borderRadius: ui.radius.lg,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    backgroundColor: palette.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 2
  },
  feedCardDark: {
    backgroundColor: themePresets.dark.colors.surfaceSoft,
    borderColor: themePresets.dark.colors.border,
    shadowColor: '#000'
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2
  },
  feedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: 'rgba(45, 141, 200, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  feedHeaderText: {
    flex: 1
  },
  feedMeta: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  feedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2
  },
  libraryCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 2
  },
  libraryCardDark: {
    backgroundColor: themePresets.dark.colors.surfaceSoft,
    borderColor: themePresets.dark.colors.border
  },
  libraryIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 141, 200, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  libraryBody: {
    flex: 1
  },
  churchDocumentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10
  },
  churchDocumentButton: {
    width: '48%',
    minHeight: 112,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    backgroundColor: palette.whiteSoft,
    padding: 12,
    gap: 9,
    alignItems: 'center',
    justifyContent: 'center'
  },
  churchDocumentLogo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    resizeMode: 'contain',
    backgroundColor: palette.white
  },
  churchDocumentLogoFallback: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.1)'
  },
  churchDocumentTitle: {
    color: palette.ink,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    textAlign: 'center'
  },
  provinceCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.32)',
    borderRadius: 24
  },
  provinceIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 2
  },
  provinceLogoMiniText: {
    color: palette.white,
    fontWeight: '900',
    fontSize: 14
  },
  provinceLogoMiniImage: {
    width: '100%',
    height: '100%'
  },
  provinceInstagramPanel: {
    gap: 10,
    marginTop: 10
  },
  provinceInstagramButton: {
    minHeight: 66,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 18,
    padding: 10,
    backgroundColor: palette.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  provinceInstagramLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: palette.whiteSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  provinceInstagramLogoImage: {
    width: '100%',
    height: '100%'
  },
  provinceInstagramName: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '900'
  },
  provinceLogoLarge: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.red,
    borderWidth: 3,
    borderColor: palette.gold,
    overflow: 'hidden'
  },
  provinceLogoText: {
    color: palette.white,
    fontWeight: '900',
    fontSize: 28
  },
  provinceLogoImage: {
    width: '100%',
    height: '100%'
  },
  provinceLogoModal: {
    width: 220,
    minHeight: 220,
    borderRadius: 16,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 18
  },
  provinceLogoModalText: {
    color: palette.red,
    fontWeight: '900',
    fontSize: 58
  },
  provinceLogoModalImage: {
    width: 170,
    height: 170,
    borderRadius: 18
  },
  provinceBody: {
    flex: 1
  },
  communityCard: {
    borderLeftColor: 'rgba(45, 141, 200, 0.45)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 15,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  communityRowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  communityRowBody: {
    flex: 1,
    minWidth: 0
  },
  communityQuickActions: {
    alignItems: 'flex-end',
    gap: 8,
    maxWidth: 92
  },
  locationIconButtonSmall: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2
  },
  communityContactButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 16,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.22)',
    backgroundColor: palette.white
  },
  communityContactButtonText: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900'
  },
  lockedCard: {
    opacity: 0.72
  },
  cardEyebrow: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6
  },
  screenIntro: {
    color: palette.inkMuted,
    fontSize: 15,
    lineHeight: 21
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.white,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1
  },
  backButtonText: {
    color: palette.red,
    fontSize: 14,
    fontWeight: '800'
  },
  cardTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    flexShrink: 1
  },
  cardText: {
    color: palette.inkMuted,
    fontSize: 15,
    lineHeight: 21,
    flexShrink: 1
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginTop: 12,
    backgroundColor: palette.whiteSoft,
    resizeMode: 'cover'
  },
  expandHint: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10
  },
  detailPanel: {
    backgroundColor: palette.white,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    gap: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2
  },
  modalPanel: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: ui.color.surface,
    borderColor: ui.color.borderStrong,
    borderWidth: 1,
    borderRadius: ui.radius.xl,
    padding: ui.space.lg,
    gap: 10,
    ...ui.shadow.modal
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 25, 38, 0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14
  },
  authConfirmPanel: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 26,
    backgroundColor: palette.white,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 12
  },
  authConfirmLogo: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: palette.whiteSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)'
  },
  authConfirmTitle: {
    fontSize: 28,
    color: palette.ink,
    fontWeight: '900',
    textAlign: 'center'
  },
  authConfirmText: {
    color: palette.inkMuted,
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    fontWeight: '700'
  },
  modalBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1
  },
  modalContentAboveBackdrop: {
    zIndex: 2
  },
  modalKeyboardAvoider: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    flexShrink: 1,
    zIndex: 2
  },
  globalSearchPanel: {
    width: '100%',
    maxHeight: '100%',
    minHeight: 260,
    paddingTop: 22,
    overflow: 'hidden'
  },
  globalSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  globalSearchInput: {
    flex: 1,
    marginTop: 0,
    minWidth: 0
  },
  globalSearchButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.red
  },
  globalSearchResults: {
    gap: 10,
    paddingTop: 2,
    paddingBottom: 18,
    flexGrow: 1
  },
  globalSearchResultsScroll: {
    width: '100%',
    maxHeight: 430,
    minHeight: 86,
    flexShrink: 1
  },
  externalNewsCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    backgroundColor: palette.white,
    padding: 16,
    gap: 11,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3
  },
  externalNewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  externalNewsControls: {
    flexDirection: 'row',
    gap: 6
  },
  externalNewsDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: 'rgba(45, 141, 200, 0.24)'
  },
  externalNewsDotActive: {
    width: 20,
    backgroundColor: palette.red
  },
  externalNewsImage: {
    width: '100%',
    height: 128,
    borderRadius: 16,
    backgroundColor: palette.whiteSoft
  },
  pmFilterGrid: {
    gap: 12
  },
  pmFilterField: {
    gap: 6,
    zIndex: 2
  },
  pmFilterDropdownList: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 18,
    backgroundColor: palette.white,
    overflow: 'hidden'
  },
  modalScrollContent: {
    paddingBottom: 34,
    paddingTop: 2,
    gap: 10
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalItem: {
    gap: 6,
    paddingTop: 6
  },
  publicProfilePanel: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 18
  },
  publicProfileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.whiteSoft,
    borderColor: palette.line,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  publicProfileAvatarImage: {
    width: '100%',
    height: '100%'
  },
  communityModalPanel: {
    width: '100%',
    maxHeight: '84%',
    borderRadius: 30,
    paddingBottom: 12,
    overflow: 'hidden'
  },
  communityModalScroll: {
    width: '100%',
    flexGrow: 0
  },
  communityModalImage: {
    width: '100%',
    height: 176,
    borderRadius: 24,
    marginBottom: 12,
    backgroundColor: palette.whiteSoft,
    resizeMode: 'cover'
  },
  communityModalMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 6
  },
  communityModalMetaItem: {
    flex: 1,
    minWidth: '46%',
    maxWidth: '100%',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(230, 243, 245, 0.78)'
  },
  communityModalMetaText: {
    flex: 1,
    minWidth: 0,
    color: palette.ink,
    fontSize: 12,
    fontWeight: '800'
  },
  groupNote: {
    backgroundColor: palette.goldSoft,
    borderColor: 'rgba(242, 184, 75, 0.42)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14
  },
  groupNoteText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  },
  heroMini: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 22,
    padding: 18,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 1
  },
  contentIntro: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.12)',
    borderRadius: 20,
    padding: 14,
    gap: 6,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1
  },
  hymnPanel: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 24,
    padding: 20,
    gap: 18,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2
  },
  hymnTitle: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center'
  },
  hymnStanza: {
    color: palette.ink,
    fontSize: 17,
    lineHeight: 27,
    textAlign: 'center'
  },
  flexOne: {
    flex: 1
  },
  libraryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  libraryPlainPanel: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.1)',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 4
  },
  libraryVisualPanel: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 24,
    padding: 14,
    gap: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2
  },
  libraryPlainTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  libraryVisualTitle: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '900'
  },
  iconActionButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 2
  },
  locationIconButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: palette.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2
  },
  libraryEditor: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 20,
    padding: 12,
    marginTop: 10,
    backgroundColor: palette.whiteSoft
  },
  libraryBodyInput: {
    minHeight: 170
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  emptyLibraryState: {
    paddingVertical: 22,
    gap: 6
  },
  prayerListRow: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 55, 71, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12
  },
  prayerListTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24
  },
  songListRow: {
    minHeight: 78,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 55, 71, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12
  },
  songThumb: {
    width: 58,
    height: 58,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(45, 141, 200, 0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  songThumbImage: {
    width: '100%',
    height: '100%'
  },
  songListTitle: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 25
  },
  libraryMeta: {
    color: palette.inkMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3
  },
  draftBadge: {
    alignSelf: 'flex-start',
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    marginTop: 5,
    textTransform: 'uppercase'
  },
  libraryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  tinyIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  prayerReader: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 28,
    gap: 16,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2
  },
  prayerReaderTitle: {
    color: palette.ink,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
    textAlign: 'center'
  },
  prayerReaderSubtitle: {
    color: palette.inkMuted,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    fontWeight: '700'
  },
  prayerDivider: {
    width: 110,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(23, 55, 71, 0.13)',
    alignSelf: 'center',
    marginVertical: 8
  },
  prayerParagraph: {
    color: '#111827',
    fontSize: 17,
    lineHeight: 27,
    textAlign: 'left'
  },
  songReader: {
    backgroundColor: palette.white,
    borderRadius: 24,
    padding: 16,
    gap: 16,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 2
  },
  songHeroImage: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    backgroundColor: palette.whiteSoft
  },
  songReaderTitle: {
    color: palette.ink,
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '900'
  },
  songReaderSubtitle: {
    color: palette.inkMuted,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800'
  },
  songDivider: {
    width: 118,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(45, 141, 200, 0.22)',
    marginVertical: 4
  },
  songStanza: {
    color: '#111827',
    fontSize: 17,
    lineHeight: 27
  },
  librarySource: {
    color: palette.inkMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8
  },
  pmCalendarPanel: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.08)',
    borderTopWidth: 3,
    borderTopColor: palette.green,
    borderRadius: 4,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    marginTop: 10,
    backgroundColor: palette.white
  },
  pmCalendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 24
  },
  pmCalendarNavButton: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pmCalendarNavText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500'
  },
  pmCalendarTitle: {
    color: '#3F3F3F',
    fontSize: 15,
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  pmCalendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 12
  },
  pmWeekdayText: {
    width: `${100 / 7}%`,
    color: '#A7A7A7',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center'
  },
  pmCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12
  },
  pmDaySpacer: {
    width: `${100 / 7}%`,
    height: 25
  },
  pmDayButton: {
    width: `${100 / 7}%`,
    height: 25,
    borderRadius: 13,
    borderWidth: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pmDayButtonSelected: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  pmDayText: {
    color: '#777777',
    fontSize: 14,
    fontWeight: '500'
  },
  pmDayTextSelected: {
    color: palette.white
  },
  calendarCard: {
    backgroundColor: palette.white,
    borderWidth: 0,
    borderColor: palette.line,
    borderRadius: 24,
    padding: 16,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 2
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  calendarTitle: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '800',
    textTransform: 'capitalize'
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 0,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.1)'
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  calendarWeekday: {
    width: '14.285%',
    textAlign: 'center',
    color: palette.inkMuted,
    fontWeight: '800',
    marginBottom: 6
  },
  calendarDay: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  calendarDayDark: {
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderRadius: 12
  },
  calendarEventDay: {
    backgroundColor: palette.goldSoft,
    borderRadius: 12
  },
  calendarMotivadorDay: {
    backgroundColor: 'rgba(37, 161, 123, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(37, 161, 123, 0.42)',
    borderRadius: 12
  },
  calendarActivityDay: {
    backgroundColor: palette.red,
    borderRadius: 12
  },
  calendarDayText: {
    color: palette.ink,
    fontWeight: '700'
  },
  calendarEventText: {
    color: palette.red,
    fontWeight: '900'
  },
  calendarActivityText: {
    color: palette.white,
    fontWeight: '900'
  },
  calendarMultiDot: {
    position: 'absolute',
    bottom: 5,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.blueDeep
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ui.color.surface,
    borderColor: ui.color.border,
    borderWidth: 1,
    borderRadius: ui.radius.md,
    padding: ui.space.md,
    ...ui.shadow.soft
  },
  noticeText: {
    flex: 1,
    color: palette.ink,
    fontSize: 14,
    lineHeight: 20
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6
  },
  settingRowText: {
    flex: 1
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  verifiedText: {
    color: palette.green,
    fontWeight: '900'
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8
  },
  profileHero: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 18,
    backgroundColor: ui.color.surface,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.xl,
    padding: 16,
    ...ui.shadow.soft
  },
  profileHeroInfo: {
    flex: 1,
    paddingTop: 2
  },
  profileName: {
    color: palette.ink,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    flex: 1
  },
  profileRolePill: {
    alignSelf: 'flex-start',
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    borderRadius: ui.radius.pill,
    backgroundColor: ui.color.primarySoft,
    borderWidth: 1,
    borderColor: ui.color.borderStrong,
    marginTop: 2,
    marginBottom: 8
  },
  profileRolePillText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '900'
  },
  profileEmailText: {
    color: palette.inkMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700'
  },
  profileMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12
  },
  profileMetaItem: {
    flex: 1,
    minWidth: '46%',
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: ui.radius.md,
    padding: 12,
    backgroundColor: ui.color.surface,
    borderWidth: 1,
    borderColor: ui.color.border
  },
  profileMetaText: {
    flex: 1
  },
  profileMetaLabel: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 3
  },
  profileMetaValue: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  profileHonorText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '900'
  },
  digitalCredential: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: ui.radius.lg,
    borderWidth: 1,
    borderColor: ui.color.borderStrong,
    backgroundColor: ui.color.surface,
    padding: 14,
    ...ui.shadow.soft
  },
  digitalCredentialDark: {
    backgroundColor: themePresets.dark.colors.surfaceSoft,
    borderColor: themePresets.dark.colors.border
  },
  credentialAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.whiteSoft
  },
  credentialAvatarImage: {
    width: '100%',
    height: '100%'
  },
  credentialName: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '900'
  },
  credentialQrPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: ui.radius.md,
    borderWidth: 1,
    borderColor: ui.color.border,
    backgroundColor: ui.color.surfaceSoft,
    padding: 10
  },
  credentialQrImage: {
    width: 112,
    height: 112,
    borderRadius: 8,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  credentialQrExpandedPanel: {
    alignItems: 'center',
    maxWidth: 360
  },
  credentialQrExpandedImage: {
    width: 284,
    height: 284,
    borderRadius: 22,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)'
  },
  qrCamera: {
    width: '100%',
    minHeight: 280,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: palette.ink
  },
  avatarFrameLarge: {
    width: 104,
    height: 104,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: ui.color.borderStrong,
    backgroundColor: ui.color.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...ui.shadow.soft
  },
  avatarImageLarge: {
    width: '100%',
    height: '100%'
  },
  photoChangeButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: ui.color.border,
    backgroundColor: ui.color.surface,
    borderRadius: ui.radius.md,
    minHeight: 38,
    paddingHorizontal: 12,
    marginTop: 12,
    ...ui.shadow.none
  },
  photoChangeText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '900'
  },
  photoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 20, 28, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  photoModalImage: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: palette.white
  },
  photoModalClose: {
    position: 'absolute',
    top: 44,
    right: 24,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  accountMenu: {
    position: 'absolute',
    top: 48,
    right: 0,
    zIndex: 8,
    width: 238,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 22,
    padding: 10,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6
  },
  accountMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 141, 200, 0.12)',
    marginBottom: 4
  },
  accountMenuAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.whiteSoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  accountMenuAvatarImage: {
    width: '100%',
    height: '100%'
  },
  accountMenuName: {
    color: palette.ink,
    fontWeight: '900',
    fontSize: 13
  },
  accountMenuSub: {
    color: palette.inkMuted,
    fontSize: 12,
    marginTop: 2
  },
  accountMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 38,
    paddingHorizontal: 8,
    borderRadius: 14
  },
  accountMenuItemText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700'
  },
  accountMenuDanger: {
    color: palette.red
  },
  primaryButton: {
    backgroundColor: palette.red,
    minHeight: 42,
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: ui.radius.sm,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    ...ui.shadow.soft
  },
  primaryButtonText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 1
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: ui.color.borderStrong,
    minHeight: 42,
    maxWidth: '100%',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: ui.radius.sm,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: ui.color.surface
  },
  secondaryButtonText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 1
  },
  tabBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 0,
    borderRadius: 30,
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 6,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 10
  },
  tabBarCompact: {
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 26,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 7
  },
  tabBarDark: {
    backgroundColor: 'rgba(16, 43, 56, 0.97)',
    shadowColor: '#000000'
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    minWidth: 0
  },
  tabButtonCompact: {
    gap: 2
  },
  tabIconFrame: {
    width: 38,
    height: 34,
    borderWidth: 0,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 15,
    borderBottomLeftRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.1)'
  },
  tabIconFrameCompact: {
    width: 33,
    height: 31,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 13,
    borderBottomLeftRadius: 8
  },
  viewAllButton: {
    width: 'auto',
    minWidth: 76,
    paddingHorizontal: 10
  },
  linkText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '900'
  },
  inlineLinkText: {
    color: palette.red,
    fontWeight: '900',
    textDecorationLine: 'underline'
  },
  tabIconFrameActive: {
    backgroundColor: palette.red,
    borderColor: palette.red,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3
  },
  tabLabel: {
    color: palette.inkMuted,
    fontSize: 9,
    fontWeight: '700',
    maxWidth: 58,
    textAlign: 'center'
  },
  tabLabelCompact: {
    fontSize: 8,
    maxWidth: 46
  },
  tabLabelActive: {
    color: palette.red
  },
  tabActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.red,
    marginTop: 1
  },
  profileCommunityPanel: {
    backgroundColor: ui.color.surface,
    borderColor: ui.color.border,
    borderWidth: 1,
    borderRadius: ui.radius.lg,
    padding: ui.space.md,
    marginTop: 12,
    gap: 10,
    ...ui.shadow.soft
  },
  contentBlockStack: {
    gap: 10
  },
  contentBlockCard: {
    marginTop: 0
  },
  communityActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center'
  },
  communityProfileHeading: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30
  },
  communityProfileSubheading: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  communityLeadersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap'
  },
  communityMiniButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    backgroundColor: 'rgba(230, 243, 245, 0.72)',
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  communityMiniButtonText: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '900'
  },
  communityMembersToggle: {
    alignSelf: 'auto'
  },
  membersDropdownList: {
    maxHeight: 320
  },
  membersDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    backgroundColor: 'rgba(230, 243, 245, 0.56)',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  profileShell: {
    position: 'relative',
    backgroundColor: palette.white,
    borderWidth: 0,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 24,
    padding: 16,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 2
  },
  roleTimeline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  roleStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 16,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: palette.white
  },
  roleStepActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  roleStepRank: {
    color: palette.red,
    fontWeight: '900'
  },
  roleStepLabel: {
    color: palette.ink,
    fontWeight: '800',
    fontSize: 12
  },
  roleStepTextActive: {
    color: palette.white
  },
  innerNewsCard: {
    backgroundColor: palette.white,
    borderColor: 'rgba(45, 141, 200, 0.12)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    minWidth: 0,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1
  },
  adminUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  adminUserHeaderText: {
    flex: 1,
    minWidth: 0
  },
  mailboxRecipientItem: {
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 141, 200, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.white
  },
  mailboxRecipientItemSelected: {
    backgroundColor: 'rgba(45, 141, 200, 0.1)'
  },
  mailboxRecipientItemDark: {
    backgroundColor: '#33383B',
    borderBottomColor: 'rgba(139, 201, 234, 0.16)'
  },
  mailboxRecipientName: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  mailboxRecipientNameDark: {
    color: themePresets.dark.colors.text
  },
  mailboxRecipientMeta: {
    color: palette.inkMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 2
  },
  mailboxRecipientMetaDark: {
    color: themePresets.dark.colors.muted
  },
  mailboxShell: {
    backgroundColor: ui.color.surface,
    borderColor: ui.color.border,
    borderWidth: 1,
    borderRadius: ui.radius.xl,
    padding: 14,
    gap: 12,
    ...ui.shadow.soft
  },
  mailboxHeaderBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12
  },
  mailboxCountBadge: {
    minWidth: 58,
    minHeight: 58,
    borderRadius: ui.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.color.primarySoft,
    borderWidth: 1,
    borderColor: ui.color.borderStrong,
    paddingHorizontal: 8
  },
  mailboxCountValue: {
    color: palette.red,
    fontSize: 19,
    fontWeight: '900'
  },
  mailboxCountLabel: {
    color: palette.inkMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  mailboxToolbar: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  mailboxTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 6,
    borderRadius: ui.radius.lg,
    backgroundColor: ui.color.surfaceMuted
  },
  mailboxMessageCard: {
    backgroundColor: ui.color.surface,
    borderColor: ui.color.border,
    borderWidth: 1,
    borderRadius: ui.radius.lg,
    padding: 14,
    gap: 9,
    ...ui.shadow.none
  },
  mailboxMessageTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10
  },
  mailboxMessageIcon: {
    width: 38,
    height: 38,
    borderRadius: ui.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.color.primarySoft,
    borderWidth: 1,
    borderColor: ui.color.border
  },
  mailboxConversationRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: ui.color.surface,
    ...ui.shadow.none
  },
  mailboxConversationRowActive: {
    backgroundColor: '#EFF8FB',
    borderColor: ui.color.borderStrong
  },
  mailboxAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.color.primarySoft,
    borderWidth: 1,
    borderColor: ui.color.borderStrong
  },
  mailboxAvatarText: {
    color: palette.red,
    fontSize: 16,
    fontWeight: '900'
  },
  mailboxConversationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  mailboxConversationTitle: {
    flex: 1,
    minWidth: 0,
    color: palette.ink,
    fontSize: 15,
    fontWeight: '900'
  },
  mailboxConversationBadges: {
    alignItems: 'flex-end',
    gap: 6
  },
  mailboxUnreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: palette.red
  },
  mailboxThreadPanel: {
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    backgroundColor: '#FAFDFD',
    padding: 12,
    gap: 12
  },
  mailboxThreadKeyboard: {
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    backgroundColor: '#FAFDFD',
    padding: 12,
    gap: 12
  },
  mailboxThreadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  mailboxThreadScroll: {
    maxHeight: 420
  },
  mailboxThreadScrollContent: {
    paddingBottom: 14
  },
  mailboxBubble: {
    maxWidth: '88%',
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 5,
    marginBottom: 9
  },
  mailboxBubbleReceived: {
    alignSelf: 'flex-start',
    backgroundColor: ui.color.surface
  },
  mailboxBubbleSent: {
    alignSelf: 'flex-end',
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  mailboxBubbleMeta: {
    color: palette.inkMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  mailboxBubbleText: {
    color: palette.ink,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700'
  },
  mailboxBubbleTextSent: {
    color: palette.white
  },
  mailboxReplyBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8
  },
  mailboxReplyInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 112,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: ui.color.surface,
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700',
    textAlignVertical: 'top'
  },
  mailboxRulesNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFF6F0',
    borderWidth: 1,
    borderColor: '#F7D6C8',
    marginBottom: 10
  },
  mailboxReportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 8
  },
  mailboxReportPanel: {
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#DDECF0'
  },
  mailboxReportModal: {
    width: '92%',
    maxHeight: '86%',
    alignSelf: 'center'
  },
  mailboxReportModalContent: {
    gap: 12,
    paddingBottom: 4
  },
  mailboxReportReasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  mailboxReportReasonButton: {
    minWidth: '46%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8EAF0',
    backgroundColor: palette.white,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  flexButton: {
    flex: 1
  },
  compactNumberInput: {
    width: 76,
    minWidth: 76,
    marginBottom: 0,
    textAlign: 'center'
  },
  adminUserAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.whiteSoft,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  adminUserAvatarImage: {
    width: '100%',
    height: '100%'
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center'
  },
  compactToolRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center'
  },
  compactTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  compactSquareButton: {
    minWidth: 76,
    minHeight: 40,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3
  },
  compactSquareButtonActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  compactSquareButtonText: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center'
  },
  compactSquareButtonTextActive: {
    color: palette.white
  },
  actionPill: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.md,
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: ui.color.surface
  },
  actionPillActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  actionPillText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '900'
  },
  actionPillTextActive: {
    color: palette.white
  },
  rowActionButton: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: ui.color.surface
  },
  rowActionButtonDanger: {
    borderColor: 'rgba(185, 50, 50, 0.18)',
    backgroundColor: 'rgba(185, 50, 50, 0.05)'
  },
  rowActionButtonText: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '900'
  },
  rowActionButtonTextDanger: {
    color: ui.color.danger
  },
  inlineEditButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)',
    borderRadius: ui.radius.sm,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.white,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 1
  },
  inlineEditButtonText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '900'
  },
  inlineEditorPanel: {
    backgroundColor: ui.color.surface,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    padding: ui.space.md,
    gap: 8,
    ...ui.shadow.soft
  },
  inlineEditorToolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(230, 243, 245, 0.55)'
  },
  smallActionButton: {
    minHeight: 34,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: ui.radius.sm,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.white
  },
  smallActionText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  inlineBlockEditor: {
    backgroundColor: palette.whiteSoft,
    borderRadius: 18,
    padding: 12,
    gap: 6
  },
  inlineBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  inlineIconActions: {
    flexDirection: 'row',
    gap: 6
  },
  iconButtonGhost: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.12)'
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  horizontalChips: {
    gap: 8,
    paddingVertical: 4
  },
  filterChip: {
    borderWidth: 1,
    borderColor: ui.color.border,
    backgroundColor: ui.color.surface,
    borderRadius: ui.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  filterChipActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  disabledChip: {
    opacity: 0.42
  },
  disabledButton: {
    opacity: 0.48
  },
  filterChipText: {
    color: palette.ink,
    fontWeight: '800'
  },
  filterChipTextActive: {
    color: palette.white
  },
  avatarPlaceholder: {
    height: 132,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 66,
    backgroundColor: palette.whiteSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  communityChoiceList: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 18,
    padding: 8,
    gap: 8,
    backgroundColor: palette.whiteSoft
  },
  communityChoice: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: palette.white
  },
  communityChoiceActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  qrActivityUserSelected: {
    backgroundColor: palette.red,
    borderRadius: 12,
    paddingHorizontal: 10
  },
  qrActivityUserSelectedText: {
    color: palette.white
  },
  statusBanner: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12
  },
  statusBanner_pendiente: {
    backgroundColor: palette.goldSoft,
    borderColor: palette.gold
  },
  statusBanner_aprobado: {
    backgroundColor: '#E4F7F0',
    borderColor: palette.green
  },
  statusBanner_bloqueado: {
    backgroundColor: '#FDE8E8',
    borderColor: '#D94B4B'
  },
  statusBannerText: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4
  },
  statusBannerSubtext: {
    color: palette.inkMuted,
    fontSize: 14,
    lineHeight: 20
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.md,
    paddingHorizontal: 14,
    marginTop: 10,
    color: palette.ink,
    backgroundColor: ui.color.surface
  },
  inputDark: {
    backgroundColor: '#33383B',
    borderColor: 'rgba(139, 201, 234, 0.28)',
    color: themePresets.dark.colors.text
  },
  inputFocused: {
    borderColor: palette.red,
    shadowColor: palette.red,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1
  },
  inputError: {
    borderColor: 'rgba(209, 71, 71, 0.82)',
    backgroundColor: 'rgba(255, 246, 246, 0.96)'
  },
  inputLabel: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 0
  },
  formErrorText: {
    color: '#B93232',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 5
  },
  passwordField: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.md,
    paddingLeft: 14,
    paddingRight: 8,
    marginTop: 10,
    backgroundColor: ui.color.surface,
    flexDirection: 'row',
    alignItems: 'center'
  },
  passwordInput: {
    flex: 1,
    minHeight: 46,
    color: palette.ink
  },
  passwordToggle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center'
  },
  passwordInputWrap: {
    position: 'relative',
    justifyContent: 'center'
  },
  inputWithIcon: {
    paddingRight: 52
  },
  passwordEyeButton: {
    position: 'absolute',
    right: 8,
    top: 15,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.75)'
  },
  completionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(207, 52, 49, 0.24)',
    backgroundColor: 'rgba(255, 246, 246, 0.9)',
    borderRadius: 16,
    padding: 12
  },
  completionNoticeText: {
    flex: 1,
    color: palette.ink,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20
  },
  textArea: {
    minHeight: 110,
    paddingTop: 12,
    textAlignVertical: 'top'
  },
  dropdownButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.md,
    paddingHorizontal: 14,
    marginTop: 8,
    backgroundColor: ui.color.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  dropdownButtonDark: {
    backgroundColor: '#33383B',
    borderColor: 'rgba(139, 201, 234, 0.28)'
  },
  dropdownButtonText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '800',
    flex: 1
  },
  dropdownButtonTextDark: {
    color: themePresets.dark.colors.text
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.md,
    backgroundColor: ui.color.surface,
    marginTop: 8,
    maxHeight: 200,
    overflow: 'hidden'
  },
  adminUsersToolList: {
    maxHeight: 250
  },
  dropdownListDark: {
    backgroundColor: '#33383B',
    borderColor: 'rgba(139, 201, 234, 0.28)'
  },
  dropdownItem: {
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 141, 200, 0.1)',
    justifyContent: 'center'
  },
  adminUsersToolItem: {
    minHeight: 62,
    paddingVertical: 12,
    alignItems: 'stretch'
  },
  adminUsersToolItemActive: {
    backgroundColor: palette.red
  },
  adminUsersToolItemTextActive: {
    color: palette.white
  },
  adminUsersToolItemMetaActive: {
    color: 'rgba(255,255,255,0.82)'
  },
  dropdownItemDark: {
    borderBottomColor: 'rgba(139, 201, 234, 0.16)'
  },
  dropdownItemText: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '700'
  },
  dropdownItemTextDark: {
    color: themePresets.dark.colors.text
  },
  debugPanel: {
    backgroundColor: '#FFF8DF',
    borderColor: 'rgba(243, 183, 0, 0.34)',
    borderWidth: 1,
    borderRadius: ui.radius.md,
    padding: ui.space.md,
    marginBottom: ui.space.sm
  },
  debugText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '800'
  },
  adminPanel: {
    backgroundColor: ui.color.surface,
    borderColor: ui.color.border,
    borderWidth: 1,
    borderRadius: ui.radius.xl,
    padding: ui.space.xl,
    gap: ui.space.md,
    marginTop: ui.space.md,
    ...ui.shadow.soft
  },
  collapsedPanel: {
    display: 'none'
  },
  adminModuleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#F6FBFC',
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    padding: 8
  },
  adminModuleGridDark: {
    backgroundColor: 'rgba(168, 221, 243, 0.08)',
    borderWidth: 1,
    borderColor: themePresets.dark.colors.border
  },
  adminModuleButton: {
    width: '23%',
    minHeight: 62,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.10)',
    backgroundColor: ui.color.surface,
    borderRadius: ui.radius.md,
    paddingHorizontal: 6,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    ...ui.shadow.none
  },
  adminModuleButtonDark: {
    backgroundColor: 'rgba(168, 221, 243, 0.08)',
    borderColor: themePresets.dark.colors.border
  },
  adminModuleButtonActive: {
    backgroundColor: ui.color.primary,
    borderColor: ui.color.primary,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 2
  },
  adminModuleText: {
    color: palette.ink,
    fontSize: 10.5,
    fontWeight: '900',
    textAlign: 'center'
  },
  adminModuleTextDark: {
    color: themePresets.dark.colors.text
  },
  adminModuleTextActive: {
    color: palette.white
  },
  adminWorkspace: {
    backgroundColor: '#FAFDFD',
    borderColor: ui.color.border,
    borderWidth: 1,
    borderRadius: ui.radius.lg,
    padding: ui.space.lg,
    gap: ui.space.md,
    ...ui.shadow.none
  },
  adminWorkspaceDark: {
    backgroundColor: '#32373A',
    borderColor: themePresets.dark.colors.border,
    shadowColor: '#000'
  },
  adminStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7E0',
    borderWidth: 1,
    borderColor: 'rgba(243, 183, 0, 0.24)',
    borderRadius: ui.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  adminStatusText: {
    color: palette.ink,
    fontWeight: '900',
    fontSize: 13
  },
  adminStatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  adminStat: {
    flex: 1,
    minWidth: '46%',
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    padding: ui.space.lg,
    backgroundColor: ui.color.surface,
    ...ui.shadow.none
  },
  adminStatNumber: {
    color: palette.red,
    fontSize: 22,
    fontWeight: '900'
  },
  adminStatLabel: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '800'
  },
  leadershipUsersList: {
    maxHeight: 340
  },
  leadershipUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderRadius: ui.radius.lg,
    borderWidth: 1,
    borderColor: ui.color.border,
    backgroundColor: ui.color.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    ...ui.shadow.none
  },
  adminEditForm: {
    gap: 4
  },
  adminInlineEditor: {
    backgroundColor: ui.color.surface,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    padding: ui.space.lg,
    margin: 8,
    ...ui.shadow.none
  },
  adminQuickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  adminQuickAction: {
    flex: 1,
    minWidth: '46%',
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.md,
    paddingHorizontal: 12,
    backgroundColor: ui.color.surface
  },
  adminQuickActionDark: {
    backgroundColor: 'rgba(168, 221, 243, 0.08)',
    borderColor: themePresets.dark.colors.border
  },
  adminQuickText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '900',
    flex: 1
  },
  adminPreviewPane: {
    backgroundColor: '#F6FBFC',
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    padding: ui.space.lg,
    gap: 8
  },
  previewButtonSwatch: {
    minHeight: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    alignSelf: 'flex-start'
  },
  permissionGrid: {
    gap: 10
  },
  permissionToggle: {
    minHeight: 64,
    borderRadius: ui.radius.lg,
    paddingHorizontal: ui.space.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ui.color.surface,
    borderWidth: 1,
    borderColor: ui.color.border
  },
  permissionToggleActive: {
    backgroundColor: ui.color.primary,
    borderColor: ui.color.primary
  },
  permissionToggleTitle: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '900'
  },
  permissionToggleTitleActive: {
    color: palette.white
  },
  permissionToggleMeta: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2
  },
  permissionToggleMetaActive: {
    color: 'rgba(255,255,255,0.78)'
  },
  colorInput: {
    flex: 1,
    minWidth: 130
  },
  keyboardSafeSpacer: {
    height: 130
  },
  adminListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    paddingHorizontal: ui.space.md,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: ui.color.surface
  },
  provinceAdminRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14
  },
  provinceAdminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
    flex: 1
  },
  provinceAdminActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8
  },
  adminListRowActive: {
    backgroundColor: '#EFF8FB',
    borderColor: ui.color.borderStrong
  },
  qrActivityListRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: ui.color.surface
  },
  qrActivityListRowActive: {
    backgroundColor: '#EFF8FB',
    borderColor: ui.color.borderStrong
  },
  adminDocumentThumb: {
    width: 42,
    height: 42,
    borderRadius: ui.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    resizeMode: 'contain',
    backgroundColor: ui.color.surfaceMuted
  },
  adminStateDraft: {
    color: palette.red,
    fontWeight: '900',
    fontSize: 12
  },
  blockEditorCard: {
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    padding: ui.space.lg,
    backgroundColor: ui.color.surface
  },
  adminMessage: {
    color: palette.ink,
    backgroundColor: '#F6FBFC',
    borderWidth: 1,
    borderColor: ui.color.border,
    borderRadius: ui.radius.lg,
    padding: ui.space.md,
    fontWeight: '800'
  },
  tabEditorRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(45, 141, 200, 0.14)',
    paddingTop: 10,
    marginTop: 8
  },
  navigationBuilderScreen: {
    marginHorizontal: 0,
    marginTop: 0,
    padding: 14,
    borderRadius: 28,
    gap: 14,
    backgroundColor: '#E6F3F5',
    overflow: 'hidden'
  },
  navigationDedicatedShell: {
    marginHorizontal: -16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 18,
    borderRadius: 32,
    gap: 12,
    backgroundColor: '#DFF0F6'
  },
  navigationDedicatedTopbar: {
    gap: 12,
    padding: 14,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)'
  },
  navigationDedicatedBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  navigationDedicatedLogo: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.red
  },
  navigationDedicatedTitle: {
    color: palette.ink,
    fontSize: 21,
    fontWeight: '900'
  },
  navigationDedicatedSubtitle: {
    color: palette.inkMuted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700'
  },
  navigationBackButton: {
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(45, 141, 200, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)'
  },
  navigationBackButtonText: {
    color: palette.red,
    fontSize: 13,
    fontWeight: '900'
  },
  navigationDedicatedMessage: {
    color: palette.ink,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontWeight: '800',
    overflow: 'hidden'
  },
  navigationBuilderHero: {
    minHeight: 168,
    borderRadius: 28,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: palette.red,
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 5
  },
  navigationHeroText: {
    flex: 1,
    gap: 8,
    paddingRight: 12
  },
  navigationHeroEyebrow: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  navigationHeroTitle: {
    color: palette.white,
    fontSize: 27,
    lineHeight: 31,
    fontWeight: '900'
  },
  navigationHeroBody: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600'
  },
  navigationHeroBadge: {
    width: 50,
    height: 50,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  navigationStatsRow: {
    flexDirection: 'row',
    gap: 10
  },
  navigationStatPill: {
    flex: 1,
    minHeight: 74,
    borderRadius: 22,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)'
  },
  navigationStatValue: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '900'
  },
  navigationStatLabel: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2
  },
  navigationPhonePreview: {
    borderRadius: 30,
    padding: 14,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    shadowColor: palette.blueDeep,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2
  },
  navigationPhoneTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  navigationPhoneTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '900'
  },
  navigationPhoneSub: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  navigationPhoneStatus: {
    width: 42,
    height: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(45, 141, 200, 0.18)'
  },
  navigationPreviewContent: {
    minHeight: 86,
    borderRadius: 22,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.1)'
  },
  navigationPreviewLabel: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '900'
  },
  navigationPreviewHint: {
    color: palette.inkMuted,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18
  },
  navigationRail: {
    gap: 10,
    paddingVertical: 2
  },
  navigationRailItem: {
    width: 104,
    minHeight: 88,
    borderRadius: 24,
    padding: 11,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)'
  },
  navigationRailItemActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  navigationRailText: {
    color: palette.ink,
    fontSize: 12,
    fontWeight: '900'
  },
  navigationRailMeta: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '800'
  },
  navigationRailTextActive: {
    color: palette.white
  },
  navigationFocusPanel: {
    borderRadius: 28,
    padding: 14,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.15)'
  },
  navigationFocusHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center'
  },
  navigationFocusIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.12)'
  },
  navigationFocusTitle: {
    color: palette.ink,
    fontSize: 19,
    fontWeight: '900'
  },
  navigationFieldGrid: {
    gap: 2
  },
  navigationField: {
    gap: 0
  },
  navigationIconPicker: {
    gap: 8,
    paddingVertical: 4
  },
  navigationIconChoice: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.12)'
  },
  navigationIconChoiceActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  navigationActionGrid: {
    flexDirection: 'row',
    gap: 9
  },
  navigationMiniAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: 17,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)'
  },
  navigationMiniActionActive: {
    backgroundColor: palette.red,
    borderColor: palette.red
  },
  navigationMiniActionText: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '900'
  },
  navigationMiniActionTextActive: {
    color: palette.white
  },
  navigationRolesPanel: {
    gap: 8
  },
  navigationRolesButton: {
    minHeight: 58,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    backgroundColor: 'rgba(45, 141, 200, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)'
  },
  navigationRolesSummary: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '800'
  },
  navigationSelectedRolesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7
  },
  navigationSelectedRoleChip: {
    minHeight: 32,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)'
  },
  navigationSelectedRoleText: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: '900'
  },
  navigationRolesDropdown: {
    borderRadius: 20,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)',
    overflow: 'hidden'
  },
  navigationRoleOption: {
    minHeight: 44,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 141, 200, 0.08)'
  },
  navigationRoleOptionText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '800',
    flex: 1
  },
  navigationLargeButton: {
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 18
  },
  navigationCreatePanel: {
    borderRadius: 28,
    padding: 14,
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)'
  },
  navigationCreateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  navigationRestoreButton: {
    minHeight: 50,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.22)'
  },
  navPreviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)'
  },
  navPreviewItem: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    justifyContent: 'center',
    minWidth: 0,
    alignItems: 'center',
    gap: 4,
    opacity: 1
  },
  navPreviewItemSelected: {
    backgroundColor: palette.red
  },
  navPreviewItemHidden: {
    opacity: 0.42
  },
  navPreviewText: {
    color: palette.ink,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center'
  },
  navPreviewTextSelected: {
    color: palette.white
  },
  navigationEditorCard: {
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.14)',
    borderRadius: 20,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.62)',
    gap: 10
  },
  navigationEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  navEditorIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 141, 200, 0.1)'
  },
  intentionsContent: {
    gap: 16,
    backgroundColor: '#fffaf0'
  },
  intentionsContentDark: {
    backgroundColor: '#2b2520'
  },
  intentionsHero: {
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    position: 'relative',
    borderRadius: 24,
    backgroundColor: '#fff8e9',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 22,
    paddingBottom: 86
  },
  intentionsHeroDark: {
    backgroundColor: '#332921',
    borderWidth: 1,
    borderColor: 'rgba(242, 138, 0, 0.24)',
    shadowColor: '#ff8a00',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  intentionsSpiritImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(242, 138, 0, 0.18)'
  },
  intentionsSpiritImageDark: {
    backgroundColor: 'rgba(255, 244, 223, 0.09)',
    borderColor: 'rgba(242, 138, 0, 0.32)'
  },
  intentionsSpiritPhoto: {
    width: 82,
    height: 82,
    borderRadius: 41
  },
  intentionsHeroTitle: {
    color: '#f28a00',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '900',
    textAlign: 'center',
    zIndex: 2
  },
  intentionsFlameCorner: {
    position: 'absolute',
    right: -10,
    bottom: -12,
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    opacity: 0.24
  },
  intentionsFlameCornerDark: {
    opacity: 0.18
  },
  intentionsFlameImage: {
    width: 104,
    height: 104,
    resizeMode: 'contain'
  },
  intentionsMainActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch'
  },
  intentionLargeButton: {
    flex: 1,
    minHeight: 82,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(242, 138, 0, 0.22)',
    padding: 10
  },
  intentionLargeButtonDark: {
    backgroundColor: '#332d27',
    borderColor: 'rgba(242, 138, 0, 0.32)',
    shadowColor: '#ff8a00',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  intentionLargeButtonActive: {
    backgroundColor: '#f28a00',
    borderColor: '#f28a00'
  },
  intentionLargeButtonText: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center'
  },
  intentionLargeButtonTextActive: {
    color: palette.white
  },
  intentionInputCard: {
    borderRadius: 20,
    padding: 14,
    gap: 12,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(242, 138, 0, 0.2)',
    shadowColor: '#ff8a00',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 2
  },
  intentionInputCardDark: {
    backgroundColor: '#332d27',
    borderColor: 'rgba(242, 138, 0, 0.3)',
    shadowColor: '#ff8a00',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  intentionsInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  intentionPrayerModal: {
    alignItems: 'center',
    paddingTop: 34
  },
  intentionPrayerModalDark: {
    backgroundColor: '#302924',
    borderWidth: 1,
    borderColor: 'rgba(242, 138, 0, 0.28)',
    shadowColor: '#ff8a00',
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5
  },
  intentionAmenButton: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 22,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f28a00'
  },
  intentionPrayerCard: {
    borderRadius: 20,
    padding: 18,
    gap: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(242, 138, 0, 0.2)'
  },
  candleStage: {
    width: 116,
    height: 170,
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  candleGlow: {
    position: 'absolute',
    top: 10,
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(255, 190, 92, 0.24)'
  },
  candleFlame: {
    position: 'absolute',
    top: 18,
    width: 28,
    height: 44,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 8,
    backgroundColor: '#ffb23f',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#ff8a00',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5
  },
  candleBody: {
    width: 54,
    height: 108,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(242, 138, 0, 0.22)'
  },
  candleWax: {
    width: '100%',
    backgroundColor: '#fff4df',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  candleBase: {
    width: 86,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(242, 138, 0, 0.2)'
  },
  intentionText: {
    color: palette.ink,
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
    fontWeight: '700'
  },
  intentionsPanel: {
    borderColor: 'rgba(242, 138, 0, 0.18)'
  },
  intentionsPanelDark: {
    backgroundColor: '#332d27',
    borderColor: 'rgba(242, 138, 0, 0.28)',
    shadowColor: '#ff8a00',
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  intentionsPrimaryButton: {
    backgroundColor: '#f28a00'
  },
  intentionsOutlineButton: {
    borderColor: 'rgba(242, 138, 0, 0.28)',
    backgroundColor: '#fff8e9'
  },
  intentionsOutlineButtonDark: {
    backgroundColor: '#332d27',
    borderColor: 'rgba(242, 138, 0, 0.34)'
  },
  intentionsOutlineButtonText: {
    color: '#f28a00'
  },
  intentionsSmallActionButton: {
    borderColor: 'rgba(242, 138, 0, 0.3)',
    backgroundColor: '#fff8e9'
  },
  intentionsSmallActionText: {
    color: '#f28a00'
  },
  adminHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12
  },
  colorSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#0b2c3a',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2
  },
  colorSwatchActive: {
    borderColor: palette.ink,
    transform: [{ scale: 1.08 }]
  },
  formationHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 22,
    padding: 16,
    backgroundColor: '#eef8fb',
    borderWidth: 1,
    borderColor: 'rgba(45,141,200,0.18)',
    shadowColor: '#2d8dc8',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  formationHeroDark: {
    backgroundColor: '#142633',
    borderColor: 'rgba(116,203,227,0.18)',
    shadowOpacity: 0.08
  },
  formationHeroIcon: {
    width: 54,
    height: 54,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.color.surface,
    borderWidth: 1,
    borderColor: 'rgba(45,141,200,0.2)'
  },
  formationHeroTitle: {
    color: palette.ink,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900'
  },
  formationHeroBody: {
    color: palette.inkMuted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700'
  },
  formationPath: {
    gap: 0,
    paddingVertical: 4
  },
  formationStationRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    minHeight: 96
  },
  formationRail: {
    width: 38,
    alignItems: 'center'
  },
  formationStationNode: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.white,
    shadowColor: '#0b2c3a',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  formationStationLine: {
    flex: 1,
    width: 3,
    opacity: 0.28
  },
  formationStationCard: {
    flex: 1,
    marginBottom: 14,
    borderRadius: 18,
    padding: 15,
    gap: 8,
    backgroundColor: ui.color.surface,
    borderWidth: 1,
    borderColor: 'rgba(45,141,200,0.18)',
    shadowColor: '#0b2c3a',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2
  },
  formationStationCardActive: {
    borderColor: 'rgba(242,64,64,0.34)',
    shadowOpacity: 0.14,
    elevation: 4
  },
  formationStationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10
  },
  formationStationTitle: {
    color: palette.ink,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900'
  },
  formationStationSubtitle: {
    color: palette.red,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900'
  },
  formationStationExpanded: {
    gap: 10,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(45,141,200,0.14)'
  },
  formationStationImage: {
    width: '100%',
    minHeight: 150,
    borderRadius: 16,
    backgroundColor: '#e6f3f7',
    resizeMode: 'cover'
  },
  formationMaterialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 50,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#f6fbfd',
    borderWidth: 1,
    borderColor: 'rgba(45,141,200,0.16)'
  }
});
