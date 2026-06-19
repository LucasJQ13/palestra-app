import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { AppCommunity, fetchCommunities } from '../lib/remoteData';
import { AppContentBlock, SecretariatMemberRecord, createCommunityContactMessage, fetchSecretariatMembers } from '../lib/profiles';
import { createInstitutionalQuery } from '../lib/queries/publicQueries';
import { PageEditorProps } from '../lib/navigationConstants';
import { inputPlaceholderColor, provinceDisplayNames, provinceLogos } from '../lib/constants';
import { APP_MESSAGES, changeDone } from '../lib/appMessages';
import { communitySectionOptions, normalizeCommunityGroup, resolveCommunitySectionVisibility } from '../lib/communitySections';
import { Coordinates, NearestCommunityResult, findNearestCommunityDetails } from '../lib/nearestCommunity';
import { Role, Session } from '../types/auth';
import { EditableIntro } from '../components/EditableIntro';
import { SectionTitle } from '../components/SectionTitle';
import { AppButton, IconButton } from '../components/ui';
import { roleLabelForProvince } from '../lib/profileDisplay';
import { subroleLabel } from '../lib/subroles';
import { useIsDarkTheme } from '../theme/ThemeContext';
import { palette } from '../theme/palette';
import { styles } from '../theme/appStyles';

const nationalSecretariatLogo = require('../../assets/qr-logo.png');

function provinceLogoSource(province?: AppCommunity | null) {
  if (!province) {
    return null;
  }
  if (province.logoUrl) {
    return { uri: province.logoUrl };
  }
  return provinceLogos[province.province] ?? null;
}

export function CommunitiesScreen({ session, title, content, refreshKey, nearbySearchEnabled, secretariatsEnabled = true, editor }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; nearbySearchEnabled?: boolean; secretariatsEnabled?: boolean; editor?: PageEditorProps }) {
  const isDark = useIsDarkTheme();
  const [communityData, setCommunityData] = useState<AppCommunity[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [selectedProvinceLogo, setSelectedProvinceLogo] = useState<AppCommunity | null>(null);
  const [showContactBox, setShowContactBox] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactName, setContactName] = useState(session?.fullName ?? '');
  const [contactInfoValue, setContactInfoValue] = useState(session?.email ?? '');
  const [contactStatus, setContactStatus] = useState('');
  const [nearestLoading, setNearestLoading] = useState(false);
  const [nearestMessage, setNearestMessage] = useState('');
  const [nearestResult, setNearestResult] = useState<NearestCommunityResult | null>(null);
  const [nearestUserLocation, setNearestUserLocation] = useState<Coordinates | null>(null);
  const [nearestUserAddress, setNearestUserAddress] = useState('');
  const [nearestModalVisible, setNearestModalVisible] = useState(false);
  const [secretariatScope, setSecretariatScope] = useState<'nacional' | 'provincia' | null>(null);
  const [secretariatMembers, setSecretariatMembers] = useState<SecretariatMemberRecord[]>([]);
  const [secretariatLoading, setSecretariatLoading] = useState(false);
  const [secretariatMessageTarget, setSecretariatMessageTarget] = useState<string | null>(null);
  const [secretariatMessage, setSecretariatMessage] = useState('');
  const [secretariatStatus, setSecretariatStatus] = useState('');
  const contactScrollRef = useRef<ScrollView | null>(null);
  const visibleCommunityData = communityData.filter((item) => item.isActive !== false && !item.archivedAt);
  const province = visibleCommunityData.find((item) => item.province === selectedProvince);
  const community = province?.locations.find((item) => item.name === selectedCommunity);
  const activeProvinceSections = province
    ? communitySectionOptions.filter((item) => resolveCommunitySectionVisibility(province.province, province.sectionVisibility)[item.key])
    : [];

  function closeSecretariat() {
    setSecretariatScope(null);
    setSecretariatMembers([]);
    setSecretariatLoading(false);
    setSecretariatStatus('');
    setSecretariatMessageTarget(null);
    setSecretariatMessage('');
  }

  useEffect(() => {
    closeSecretariat();
  }, [selectedProvince]);

  function openCommunityLocation(location: AppCommunity['locations'][number]) {
    const query = location.latitude != null && location.longitude != null
      ? `${location.latitude},${location.longitude}`
      : `${location.address}, ${province?.province ?? ''}, Argentina`;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
  }

  async function searchNearestCommunity() {
    setNearestLoading(true);
    setNearestMessage(APP_MESSAGES.community.findingLocation);
    setNearestResult(null);
    setNearestUserLocation(null);
    setNearestUserAddress('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setNearestMessage(APP_MESSAGES.community.locationPermissionDenied);
        setNearestModalVisible(true);
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      try {
        const [address] = await Location.reverseGeocodeAsync(userLocation);
        const street = [address?.street, address?.streetNumber].filter(Boolean).join(' ');
        setNearestUserAddress(street || address?.name || address?.district || address?.city || '');
      } catch {
        setNearestUserAddress('');
      }
      const sourceCommunities = visibleCommunityData.length > 0 ? visibleCommunityData : await fetchCommunities();
      if (visibleCommunityData.length === 0 && sourceCommunities.length > 0) {
        setCommunityData(sourceCommunities);
      }
      const search = findNearestCommunityDetails(sourceCommunities, userLocation, 5);
      const result = search.nearestWithinRadius;
      setNearestUserLocation(userLocation);
      setNearestResult(result);
      setNearestMessage(result
        ? ''
        : search.communitiesWithCoordinates === 0
          ? APP_MESSAGES.community.noCoordinates
          : search.nearestAnyDistance
            ? APP_MESSAGES.community.noNearbyWithNearest(search.nearestAnyDistance.community.name, search.nearestAnyDistance.distanceKm)
            : APP_MESSAGES.community.noNearby);
      setNearestModalVisible(true);
    } catch (error) {
      setNearestMessage(error instanceof Error ? error.message : APP_MESSAGES.community.locationFailed);
      setNearestModalVisible(true);
    } finally {
      setNearestLoading(false);
    }
  }

  async function openNearestInMaps() {
    if (!nearestResult || !nearestUserLocation || nearestResult.community.latitude == null || nearestResult.community.longitude == null) {
      return;
    }
    const destination = {
      latitude: Number(nearestResult.community.latitude),
      longitude: Number(nearestResult.community.longitude)
    };
    const label = encodeURIComponent(nearestResult.community.name || 'Comunidad Palestra');
    const query = `${destination.latitude},${destination.longitude}`;
    const nativeUrl = Platform.OS === 'android'
      ? `geo:0,0?q=${query}(${label})`
      : `maps://?q=${label}&ll=${query}`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && typeof window.open === 'function') {
        const opened = window.open(webUrl, '_blank', 'noopener,noreferrer');
        if (opened) {
          return;
        }
        window.location.href = webUrl;
        return;
      }
      await Linking.openURL(webUrl);
      return;
    }
    try {
      await Linking.openURL(nativeUrl);
      return;
    } catch {
      await Linking.openURL(webUrl);
    }
  }

  function openCommunityPresentation(locationName: string) {
    setShowContactBox(false);
    setContactStatus('');
    setSelectedCommunity(locationName);
  }

  function closeCommunityModal() {
    setSelectedCommunity(null);
    setShowContactBox(false);
    setContactStatus('');
  }

  async function openSecretariat(scope: 'nacional' | 'provincia', provinceName?: string | null) {
    if (secretariatScope === scope) {
      closeSecretariat();
      return;
    }
    setSecretariatScope(scope);
    setSecretariatLoading(true);
    setSecretariatStatus('');
    setSecretariatMessageTarget(null);
    setSecretariatMessage('');
    const members = await fetchSecretariatMembers(scope, provinceName ?? selectedProvince);
    setSecretariatMembers(members);
    setSecretariatLoading(false);
  }

  async function sendSecretariatMessage(targetId: string) {
    if (!session && (!contactName.trim() || !contactInfoValue.trim())) {
      setSecretariatStatus(APP_MESSAGES.community.nameAndContactRequired);
      return;
    }
    if (!secretariatMessage.trim()) {
      setSecretariatStatus(APP_MESSAGES.community.messageRequired);
      return;
    }
    const { error } = await createInstitutionalQuery({
      targetUserId: targetId,
      senderName: contactName.trim() || session?.fullName || 'Consulta externa',
      senderContact: contactInfoValue.trim() || session?.email || '',
      message: secretariatMessage.trim(),
      origin: secretariatScope === 'nacional' ? 'equipo_nacional' : 'equipo_diocesano'
    });
    if (error) {
      setSecretariatStatus(error.message);
      return;
    }
    setSecretariatStatus(changeDone(APP_MESSAGES.community.secretariatSent));
    setSecretariatMessage('');
    setSecretariatMessageTarget(null);
  }

  function renderSecretariatMembers() {
    return (
      <View style={[styles.profileCommunityPanel, isDark && styles.surfacePanelDark]}>
        {secretariatLoading ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.community.secretariatLoading}</Text> : null}
        {!secretariatLoading && secretariatMembers.length === 0 ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.community.secretariatEmpty}</Text> : null}
        {secretariatMembers.map((member) => {
          const expanded = secretariatMessageTarget === member.id;
          return (
            <View key={member.id} style={[styles.innerNewsCard, isDark && styles.surfaceRowDark]}>
              <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{member.full_name ?? 'Palestrista'}</Text>
              <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{roleLabelForProvince((member.role || 'palestrista') as Role, member.province, [], [], member.gender_preference ?? null)}</Text>
              {member.subrole_key ? <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{subroleLabel(member.subrole_key)}</Text> : null}
              <Text style={[styles.feedMeta, isDark && styles.textDarkMuted]}>{member.community_name ?? APP_MESSAGES.community.myCommunityFallback} - {member.province ?? APP_MESSAGES.community.provinceFallback}</Text>
              <AppButton label={expanded ? APP_MESSAGES.community.closeQuery : APP_MESSAGES.community.sendQuery} icon={expanded ? 'close-outline' : 'help-circle-outline'} variant="ghost" size="compact" onPress={() => setSecretariatMessageTarget(expanded ? null : member.id)} />
              {expanded ? (
                <View style={styles.stackTight}>
                  {!session ? (
                    <>
                      <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>{APP_MESSAGES.community.contactNameLabel}</Text>
                      <TextInput style={[styles.input, isDark && styles.inputDark]} value={contactName} onChangeText={setContactName} placeholder={APP_MESSAGES.community.contactNamePlaceholder} placeholderTextColor={inputPlaceholderColor} />
                      <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>{APP_MESSAGES.community.contactMethodLabel}</Text>
                      <TextInput style={[styles.input, isDark && styles.inputDark]} value={contactInfoValue} onChangeText={setContactInfoValue} placeholder={APP_MESSAGES.community.contactPlaceholder} placeholderTextColor={inputPlaceholderColor} />
                    </>
                  ) : null}
                  <TextInput
                    style={[styles.input, styles.textArea, isDark && styles.inputDark]}
                    value={secretariatMessage}
                    onChangeText={(value) => setSecretariatMessage(value.slice(0, 500))}
                    placeholder={APP_MESSAGES.community.secretariatMessagePlaceholder}
                    multiline
                    placeholderTextColor={inputPlaceholderColor}
                  />
                  <AppButton label={APP_MESSAGES.community.sendQuery} icon="send-outline" onPress={() => sendSecretariatMessage(member.id)} />
                </View>
              ) : null}
            </View>
          );
        })}
        {secretariatStatus ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{secretariatStatus}</Text> : null}
      </View>
    );
  }

  function renderCommunityRow(location: AppCommunity['locations'][number], keyPrefix = 'community') {
    return (
      <View key={`${keyPrefix}-${location.name}`} style={[styles.card, styles.communityCard, isDark && styles.surfaceCardDark]}>
        <View style={styles.communityRowHeader}>
          <TouchableOpacity style={styles.communityRowBody} activeOpacity={0.86} onPress={() => openCommunityPresentation(location.name)}>
            <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{location.name}</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{location.address}</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Contacto: {location.phone}</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Reunion: {location.meetingDay} - {location.meetingTime}</Text>
            <Text style={[styles.expandHint, isDark && styles.textDarkAccent]}>{APP_MESSAGES.community.presentationHint}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  useEffect(() => {
    let alive = true;
    fetchCommunities().then((items) => {
      if (alive) {
        setCommunityData(items);
      }
    });
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  async function sendCommunityContactMessage() {
    if (!community?.id) {
      setContactStatus(APP_MESSAGES.community.selectedCommunityMissing);
      return;
    }
    if (!contactMessage.trim()) {
      setContactStatus(APP_MESSAGES.community.messageRequired);
      return;
    }
    if (!session && (!contactName.trim() || !contactInfoValue.trim())) {
      setContactStatus(APP_MESSAGES.community.nameAndContactRequired);
      return;
    }
    const { error } = await createCommunityContactMessage({
      communityId: community.id,
      senderName: contactName.trim() || session?.fullName || 'Consulta externa',
      senderContact: contactInfoValue.trim() || session?.email || '',
      message: contactMessage.trim()
    });
    if (error) {
      setContactStatus(error.message);
      return;
    }
    setContactStatus(changeDone(APP_MESSAGES.community.contactSent));
    setContactMessage('');
  }

  useEffect(() => {
    if (Platform.OS !== 'android' || !selectedProvince) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedCommunity) {
        setSelectedCommunity(null);
        return true;
      }
      setSelectedProvince(null);
      return true;
    });
    return () => subscription.remove();
  }, [selectedCommunity, selectedProvince]);

  if (province) {
    const provinceInitials = province.province.slice(0, 2).toUpperCase();
    const provinceLogo = provinceLogoSource(province);
    return (
      <View style={styles.stack}>
        <AppButton label="Provincias" icon="chevron-back" variant="ghost" size="compact" onPress={() => { setSelectedCommunity(null); setSelectedProvince(null); }} />
        <SectionTitle title={province.province} />
        <TouchableOpacity style={styles.provinceLogoLarge} onPress={() => setSelectedProvinceLogo(province)} activeOpacity={0.85}>
          {provinceLogo ? <Image source={provinceLogo} style={styles.provinceLogoImage} /> : <Text style={styles.provinceLogoText}>{provinceInitials}</Text>}
        </TouchableOpacity>
        <Text style={styles.screenIntro}>{province.description}</Text>
        <Modal visible={Boolean(selectedProvinceLogo)} transparent animationType="fade" onRequestClose={() => setSelectedProvinceLogo(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedProvinceLogo(null)}>
            <View style={[styles.provinceLogoModal, isDark && styles.surfacePanelDark]}>
              {provinceLogoSource(selectedProvinceLogo) ? <Image source={provinceLogoSource(selectedProvinceLogo)!} style={styles.provinceLogoModalImage} /> : <Text style={styles.provinceLogoModalText}>{selectedProvinceLogo?.province.slice(0, 2).toUpperCase()}</Text>}
              <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{selectedProvinceLogo?.province}</Text>
            </View>
          </TouchableOpacity>
        </Modal>
        {secretariatsEnabled ? (
          <View style={styles.stackTight}>
            <TouchableOpacity style={[styles.card, styles.provinceCard, isDark && styles.surfaceCardDark]} onPress={() => openSecretariat('provincia', province.province)} activeOpacity={0.86}>
              <View style={styles.provinceBody}>
                <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.community.secretariats}</Text>
                <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{APP_MESSAGES.community.diocesanSecretariat}</Text>
                <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.community.diocesanSecretariatHelp(province.province)}</Text>
              </View>
              <Ionicons name={secretariatScope === 'provincia' ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color={palette.red} />
            </TouchableOpacity>
            {secretariatScope === 'provincia' ? renderSecretariatMembers() : null}
          </View>
        ) : null}
        <Modal visible={Boolean(community)} transparent animationType="slide" onRequestClose={closeCommunityModal} statusBarTranslucent>
          <View style={styles.modalOverlay} pointerEvents="box-none">
            <Pressable style={styles.modalBackdropTouch} onPress={closeCommunityModal} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0} style={styles.modalKeyboardAvoider} pointerEvents="box-none">
            <View style={[styles.modalPanel, styles.communityModalPanel, isDark && styles.surfacePanelDark]} pointerEvents="auto">
              <ScrollView
                ref={contactScrollRef}
                style={styles.communityModalScroll}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                nestedScrollEnabled
                scrollEventThrottle={16}
                overScrollMode="always"
                showsVerticalScrollIndicator
                contentContainerStyle={styles.modalScrollContent}
              >
              <IconButton icon="close" accessibilityLabel={APP_MESSAGES.community.closeCommunity} variant="ghost" onPress={closeCommunityModal} />
              {community ? (
                <>
                  <Image source={{ uri: community.imageUrl }} style={styles.communityModalImage} />
                  <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{province.region}</Text>
                  <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{community.name}</Text>
                  <View style={styles.communityModalMeta}>
                    <View style={styles.communityModalMetaItem}>
                      <Ionicons name="map-outline" size={17} color={palette.red} />
                      <Text style={[styles.communityModalMetaText, isDark && styles.textDarkBody]}>{province.province}</Text>
                    </View>
                    <View style={styles.communityModalMetaItem}>
                      <Ionicons name="people-outline" size={17} color={palette.red} />
                      <Text style={[styles.communityModalMetaText, isDark && styles.textDarkBody]}>{APP_MESSAGES.community.activeCommunities(province.locations.length)}</Text>
                    </View>
                    <View style={styles.communityModalMetaItem}>
                      <Ionicons name="call-outline" size={17} color={palette.red} />
                      <Text style={[styles.communityModalMetaText, isDark && styles.textDarkBody]}>{community.phone}</Text>
                    </View>
                    <View style={styles.communityModalMetaItem}>
                      <Ionicons name="calendar-outline" size={17} color={palette.red} />
                      <Text style={[styles.communityModalMetaText, isDark && styles.textDarkBody]}>{community.meetingDay} - {community.meetingTime}</Text>
                    </View>
                  </View>
                  <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{community.address}</Text>
                  <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{community.description}</Text>
                  <View style={styles.inlineActions}>
                    <IconButton icon="location-outline" variant="primary" onPress={() => openCommunityLocation(community)} accessibilityLabel={APP_MESSAGES.community.openLocation} />
                    <IconButton icon="chatbubble-outline" variant="primary" onPress={() => { setShowContactBox(!showContactBox); setTimeout(() => contactScrollRef.current?.scrollToEnd({ animated: true }), 120); }} accessibilityLabel={APP_MESSAGES.community.sendMessage} />
                  </View>
                  {showContactBox ? (
                    <View style={[styles.inlineEditorPanel, isDark && styles.surfacePanelDark]}>
                      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.community.messageToLeaders}</Text>
                      {!session ? (
                        <>
                          <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>{APP_MESSAGES.community.contactNameLabel}</Text>
                          <TextInput style={styles.input} placeholder={APP_MESSAGES.community.contactNamePlaceholder} value={contactName} onChangeText={setContactName} onFocus={() => setTimeout(() => contactScrollRef.current?.scrollToEnd({ animated: true }), 160)} placeholderTextColor={inputPlaceholderColor} />
                          <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>{APP_MESSAGES.community.contactMethodLabel}</Text>
                          <TextInput style={styles.input} placeholder={APP_MESSAGES.community.contactPlaceholder} value={contactInfoValue} onChangeText={setContactInfoValue} onFocus={() => setTimeout(() => contactScrollRef.current?.scrollToEnd({ animated: true }), 160)} placeholderTextColor={inputPlaceholderColor} />
                        </>
                      ) : null}
                      <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>{APP_MESSAGES.community.queryMessageLabel}</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder={APP_MESSAGES.community.communityMessagePlaceholder}
                        value={contactMessage}
                        onChangeText={(value) => setContactMessage(value.slice(0, 500))}
                        onFocus={() => setTimeout(() => contactScrollRef.current?.scrollToEnd({ animated: true }), 160)}
                        multiline placeholderTextColor={inputPlaceholderColor} />
                      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{contactMessage.length}/500</Text>
                      <AppButton label={APP_MESSAGES.community.sendQuery} icon="send-outline" onPress={sendCommunityContactMessage} />
                      {contactStatus ? <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{contactStatus}</Text> : null}
                    </View>
                  ) : null}
                </>
              ) : null}
              </ScrollView>
            </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
        {activeProvinceSections.map((section) => {
          const sectionCommunities = province.locations.filter((location) => normalizeCommunityGroup(location.group) === section.key);
          return (
            <View key={section.key} style={styles.stackTight}>
              <SectionTitle title={section.label} />
              {sectionCommunities.map((location) => renderCommunityRow(location, section.key))}
            </View>
          );
        })}
        {activeProvinceSections.length === 0 ? (
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.community.noSubsections}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {secretariatsEnabled ? (
        <View style={styles.stackTight}>
          <TouchableOpacity style={[styles.card, styles.provinceCard, isDark && styles.surfaceCardDark]} onPress={() => openSecretariat('nacional')} activeOpacity={0.86}>
            <TouchableOpacity style={styles.provinceIcon} onPress={() => openSecretariat('nacional')} activeOpacity={0.85}>
              <Image source={nationalSecretariatLogo} style={styles.provinceLogoMiniImage} />
            </TouchableOpacity>
            <View style={styles.provinceBody}>
              <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.community.secretariats}</Text>
              <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{APP_MESSAGES.community.nationalSecretariat}</Text>
              <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.community.nationalSecretariatHelp}</Text>
            </View>
            <Ionicons name={secretariatScope === 'nacional' ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color={palette.red} />
          </TouchableOpacity>
          {secretariatScope === 'nacional' ? renderSecretariatMembers() : null}
        </View>
      ) : null}
      {nearbySearchEnabled ? (
        <View style={[styles.card, isDark && styles.surfaceCardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{APP_MESSAGES.community.findNearestTitle}</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.community.findNearestHelp}</Text>
          <AppButton label={APP_MESSAGES.community.findNearestButton} icon="navigate-outline" loading={nearestLoading} onPress={searchNearestCommunity} />
        </View>
      ) : null}
      {visibleCommunityData.map((community) => (
        <TouchableOpacity key={community.province} style={[styles.card, styles.provinceCard, isDark && styles.surfaceCardDark]} onPress={() => setSelectedProvince(community.province)} activeOpacity={0.85}>
          <TouchableOpacity style={styles.provinceIcon} onPress={() => setSelectedProvinceLogo(community)} activeOpacity={0.85}>
            {provinceLogoSource(community) ? <Image source={provinceLogoSource(community)!} style={styles.provinceLogoMiniImage} /> : <Text style={styles.provinceLogoMiniText}>{community.province.slice(0, 2).toUpperCase()}</Text>}
          </TouchableOpacity>
          <View style={styles.provinceBody}>
            <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{community.region}</Text>
            <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{community.province}</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{community.description}</Text>
            <Text style={[styles.expandHint, isDark && styles.textDarkAccent]}>{APP_MESSAGES.community.activeCommunities(community.locations.length)}</Text>
          </View>
        </TouchableOpacity>
      ))}
      <Modal visible={Boolean(selectedProvinceLogo)} transparent animationType="fade" onRequestClose={() => setSelectedProvinceLogo(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedProvinceLogo(null)}>
          <View style={[styles.provinceLogoModal, isDark && styles.surfacePanelDark]}>
            {provinceLogoSource(selectedProvinceLogo) ? <Image source={provinceLogoSource(selectedProvinceLogo)!} style={styles.provinceLogoModalImage} /> : <Text style={styles.provinceLogoModalText}>{selectedProvinceLogo?.province.slice(0, 2).toUpperCase()}</Text>}
            <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{selectedProvinceLogo?.province}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={nearestModalVisible} transparent animationType="slide" onRequestClose={() => setNearestModalVisible(false)} statusBarTranslucent>
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <Pressable style={styles.modalBackdropTouch} onPress={() => setNearestModalVisible(false)} />
          <View style={[styles.modalPanel, styles.communityModalPanel, styles.modalContentAboveBackdrop, isDark && styles.surfacePanelDark]} pointerEvents="auto">
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <IconButton icon="close" accessibilityLabel="Cerrar busqueda" variant="ghost" onPress={() => setNearestModalVisible(false)} />
              {nearestResult && nearestUserLocation ? (
                <>
                  <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{nearestResult.province}</Text>
                  <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{nearestResult.community.name}</Text>
                  <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{nearestResult.community.address}</Text>
                  <View style={styles.communityModalMeta}>
                    <View style={styles.communityModalMetaItem}>
                      <Ionicons name="navigate-outline" size={17} color={palette.red} />
                      <Text style={[styles.communityModalMetaText, isDark && styles.textDarkBody]}>{nearestResult.distanceKm.toFixed(2)} km</Text>
                    </View>
                    <View style={styles.communityModalMetaItem}>
                      <Ionicons name="walk-outline" size={17} color={palette.red} />
                      <Text style={[styles.communityModalMetaText, isDark && styles.textDarkBody]}>{nearestResult.walkingMinutes} min caminando</Text>
                    </View>
                    <View style={styles.communityModalMetaItem}>
                      <Ionicons name="car-outline" size={17} color={palette.red} />
                      <Text style={[styles.communityModalMetaText, isDark && styles.textDarkBody]}>{nearestResult.drivingMinutes} min en auto</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.card, isDark && styles.surfaceCardDark]} onPress={openNearestInMaps} activeOpacity={0.86}>
                    <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{APP_MESSAGES.community.mapTitle}</Text>
                    <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.community.nearestUserLocation(nearestUserAddress)}</Text>
                    <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{APP_MESSAGES.community.nearestCommunityLocation(nearestResult.community.address)}</Text>
                    <Text style={[styles.expandHint, isDark && styles.textDarkAccent]}>{APP_MESSAGES.community.routeHint}</Text>
                  </TouchableOpacity>
                  <AppButton label={APP_MESSAGES.community.openGoogleMaps} icon="navigate-outline" onPress={openNearestInMaps} />
                </>
              ) : (
                <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{nearestMessage || APP_MESSAGES.community.noNearby}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
