import { StyleSheet } from 'react-native';
import { COMMUNITY_IMAGE_ASPECT_RATIO } from '../../../lib/constants';
import { palette } from '../../../theme/palette';

export const communityPanelStyles = StyleSheet.create({
  screen: {
    gap: 16,
    paddingBottom: 32
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#D9E7ED',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  backButtonDark: {
    backgroundColor: '#343434',
    borderColor: '#4B4B4B'
  },
  titleWrap: {
    flex: 1
  },
  eyebrow: {
    color: palette.red,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  title: {
    color: '#17394A',
    fontSize: 23,
    fontWeight: '900'
  },
  titleDark: {
    color: '#F4FAFC'
  },
  panel: {
    backgroundColor: '#F7FBFC',
    borderColor: '#DCEAF0',
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  panelDark: {
    backgroundColor: '#333333',
    borderColor: '#4A4A4A'
  },
  sectionTitle: {
    color: '#17394A',
    fontSize: 18,
    fontWeight: '900'
  },
  body: {
    color: '#58798A',
    fontSize: 14,
    lineHeight: 20
  },
  bodyDark: {
    color: '#C8D9E0'
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D4E5EB',
    borderRadius: 14,
    borderWidth: 1,
    color: '#17394A',
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  inputDark: {
    backgroundColor: '#292929',
    borderColor: '#515151',
    color: '#F4FAFC'
  },
  textArea: {
    minHeight: 112,
    textAlignVertical: 'top'
  },
  image: {
    borderRadius: 14,
    width: '100%',
    aspectRatio: COMMUNITY_IMAGE_ASPECT_RATIO,
    backgroundColor: '#DDEBF0'
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: palette.red,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: palette.red,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14
  },
  secondaryButtonText: {
    color: palette.red,
    fontSize: 14,
    fontWeight: '800'
  },
  notice: {
    borderColor: '#DCEAF0',
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 12
  },
  noticeTitle: {
    color: '#17394A',
    fontSize: 16,
    fontWeight: '800'
  },
  noticeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  editorStack: {
    gap: 10
  },
  formatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  formatButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(45, 141, 200, 0.24)',
    backgroundColor: '#F4FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  formatButtonDark: {
    backgroundColor: '#343A3E',
    borderColor: 'rgba(168, 221, 243, 0.2)'
  },
  formatButtonActive: {
    backgroundColor: '#2D8DC8',
    borderColor: '#2D8DC8'
  },
  formatButtonText: {
    color: '#2D8DC8',
    fontSize: 12,
    fontWeight: '800'
  },
  formatButtonTextActive: {
    color: '#FFFFFF'
  },
  editorBold: {
    fontWeight: '800'
  },
  editorUnderline: {
    textDecorationLine: 'underline'
  },
  mediaActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  editorImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    backgroundColor: '#DDEBF0'
  },
  secondaryButtonDark: {
    backgroundColor: '#343A3E',
    borderColor: 'rgba(168, 221, 243, 0.2)'
  },
  membersList: {
    gap: 8,
    maxHeight: 300
  },
  memberRow: {
    alignItems: 'center',
    borderBottomColor: '#DCEAF0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10
  },
  memberInfo: {
    flex: 1
  },
  memberName: {
    color: '#17394A',
    fontSize: 14,
    fontWeight: '800'
  },
  empty: {
    color: '#78919D',
    fontSize: 14,
    paddingVertical: 8
  }
});
