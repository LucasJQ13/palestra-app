import { StyleSheet } from 'react-native';
import { palette } from '../../theme/palette';

export const communityStyles = StyleSheet.create({
  screen: {
    gap: 22,
    paddingBottom: 28
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  topBarTitle: {
    color: palette.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    flex: 1
  },
  topBarTitleDark: {
    color: '#F4FAFC'
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)'
  },
  iconButtonDark: {
    backgroundColor: '#363C40',
    borderColor: 'rgba(168, 221, 243, 0.22)'
  },
  hero: {
    minHeight: 220,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: palette.red
  },
  heroImage: {
    borderRadius: 8
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 22,
    backgroundColor: 'rgba(9, 37, 52, 0.56)'
  },
  heroEyebrow: {
    color: '#D9F2FC',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 6
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '900'
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 720
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  heroMetaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  section: {
    gap: 12
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900'
  },
  sectionTitleDark: {
    color: '#F4FAFC'
  },
  sectionHint: {
    color: palette.inkMuted,
    fontSize: 13,
    lineHeight: 19
  },
  sectionHintDark: {
    color: '#C4D7DF'
  },
  peopleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  personCard: {
    minWidth: 230,
    flexBasis: 260,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.16)'
  },
  personCardDark: {
    backgroundColor: '#363C40',
    borderColor: 'rgba(168, 221, 243, 0.18)'
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F3F5',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  avatarText: {
    color: palette.red,
    fontSize: 18,
    fontWeight: '900'
  },
  personInfo: {
    flex: 1,
    minWidth: 0
  },
  personName: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '900'
  },
  personNameDark: {
    color: '#F4FAFC'
  },
  personRole: {
    color: palette.inkMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 3
  },
  personRoleDark: {
    color: '#C4D7DF'
  },
  messageButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F3F5'
  },
  messageButtonDark: {
    backgroundColor: '#2B2B2B'
  },
  noticeList: {
    gap: 10
  },
  notice: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 141, 200, 0.16)',
    gap: 7
  },
  noticeDark: {
    borderBottomColor: 'rgba(168, 221, 243, 0.16)'
  },
  noticeMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    alignItems: 'center'
  },
  noticeBadge: {
    color: palette.red,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
  noticeDate: {
    color: palette.inkMuted,
    fontSize: 11,
    fontWeight: '700'
  },
  noticeDateDark: {
    color: '#AFC7D1'
  },
  noticeTitle: {
    color: palette.ink,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900'
  },
  noticeTitleDark: {
    color: '#F4FAFC'
  },
  noticeBody: {
    color: palette.inkMuted,
    fontSize: 14,
    lineHeight: 21
  },
  noticeBodyDark: {
    color: '#E5F0F4'
  },
  noticeAuthor: {
    color: palette.inkMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  noticeImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 4
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8
  },
  emptyText: {
    color: palette.inkMuted,
    fontSize: 14,
    textAlign: 'center'
  },
  emptyTextDark: {
    color: '#C4D7DF'
  },
  membersToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#E6F3F5'
  },
  membersToggleDark: {
    backgroundColor: '#363C40'
  },
  membersToggleText: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '900'
  },
  membersList: {
    maxHeight: 360
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 141, 200, 0.13)'
  },
  memberRowDark: {
    borderBottomColor: 'rgba(168, 221, 243, 0.14)'
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: palette.red
  },
  managementButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900'
  },
  managementPanel: {
    gap: 12,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#EDF7FA',
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.18)'
  },
  managementPanelDark: {
    backgroundColor: '#303437',
    borderColor: 'rgba(168, 221, 243, 0.18)'
  }
});
