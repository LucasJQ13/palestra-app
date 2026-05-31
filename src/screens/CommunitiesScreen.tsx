import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { AppCommunity, fetchCommunities } from '../lib/remoteData';
import { AppContentBlock, createCommunityContactMessage } from '../lib/profiles';
import { PageEditorProps } from '../lib/navigationConstants';
import { inputPlaceholderColor, provinceDisplayNames, provinceLogos } from '../lib/constants';
import { changeDone } from '../lib/appMessages';
import { Coordinates, NearestCommunityResult, findNearestCommunityDetails } from '../lib/nearestCommunity';
import { Session } from '../types/auth';
import { EditableIntro } from '../components/EditableIntro';
import { SectionTitle } from '../components/SectionTitle';
import { useIsDarkTheme } from '../theme/ThemeContext';
import { palette } from '../theme/palette';
import { styles } from '../theme/appStyles';

export function CommunitiesScreen({ session, title, content, refreshKey, nearbySearchEnabled, editor }: { session: Session | null; title: string; content?: AppContentBlock; refreshKey: number; nearbySearchEnabled?: boolean; editor?: PageEditorProps }) {
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
  const contactScrollRef = useRef<ScrollView | null>(null);
  const visibleCommunityData = communityData;
  const province = visibleCommunityData.find((item) => item.province === selectedProvince);
  const community = province?.locations.find((item) => item.name === selectedCommunity);

  function openCommunityLocation(location: AppCommunity['locations'][number]) {
    const query = location.latitude != null && location.longitude != null
      ? `${location.latitude},${location.longitude}`
      : `${location.address}, ${province?.province ?? ''}, Argentina`;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
  }

  async function searchNearestCommunity() {
    setNearestLoading(true);
    setNearestMessage('Buscando tu ubicacion...');
    setNearestResult(null);
    setNearestUserLocation(null);
    setNearestUserAddress('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setNearestMessage('No pude acceder a tu ubicacion. Activa el permiso para buscar comunidades cercanas.');
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
          ? 'No hay comunidades con coordenadas validas cargadas para calcular distancia.'
          : search.nearestAnyDistance
            ? `No hemos encontrado una comunidad cerca de ti dentro de un radio de 5 km. La mas cercana cargada es ${search.nearestAnyDistance.community.name}, a ${search.nearestAnyDistance.distanceKm.toFixed(2)} km.`
            : 'No hemos encontrado una comunidad cerca de ti dentro de un radio de 5 km.');
      setNearestModalVisible(true);
    } catch (error) {
      setNearestMessage(error instanceof Error ? error.message : 'No pude obtener tu ubicacion actual.');
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
      ? `geo:${query}?q=${query}(${label})`
      : `maps://?q=${label}&ll=${query}`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
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

  function renderCommunityRow(location: AppCommunity['locations'][number], keyPrefix = 'community') {
    return (
      <View key={`${keyPrefix}-${location.name}`} style={[styles.card, styles.communityCard, isDark && styles.surfaceCardDark]}>
        <View style={styles.communityRowHeader}>
          <TouchableOpacity style={styles.communityRowBody} activeOpacity={0.86} onPress={() => openCommunityPresentation(location.name)}>
            <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{location.name}</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{location.address}</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Contacto: {location.phone}</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Reunion: {location.meetingDay} - {location.meetingTime}</Text>
            <Text style={[styles.expandHint, isDark && styles.textDarkAccent]}>Tocar para ver presentacion</Text>
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
      setContactStatus('No se encontro la comunidad seleccionada.');
      return;
    }
    if (!contactMessage.trim()) {
      setContactStatus('Escribi un mensaje antes de enviarlo.');
      return;
    }
    if (!session && (!contactName.trim() || !contactInfoValue.trim())) {
      setContactStatus('Deja tu nombre y un contacto para que puedan responderte.');
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
    setContactStatus(changeDone('Mensaje enviado al buzon de la comunidad.'));
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
    const provinceLogo = provinceLogos[province.province];
    return (
      <View style={styles.stack}>
        <TouchableOpacity style={styles.backButton} onPress={() => { setSelectedCommunity(null); setSelectedProvince(null); }} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={18} color={palette.red} />
          <Text style={styles.backButtonText}>Provincias</Text>
        </TouchableOpacity>
        <SectionTitle title={province.province} />
        <TouchableOpacity style={styles.provinceLogoLarge} onPress={() => setSelectedProvinceLogo(province)} activeOpacity={0.85}>
          {provinceLogo ? <Image source={provinceLogo} style={styles.provinceLogoImage} /> : <Text style={styles.provinceLogoText}>{provinceInitials}</Text>}
        </TouchableOpacity>
        <Text style={styles.screenIntro}>{province.description}</Text>
        <Modal visible={Boolean(selectedProvinceLogo)} transparent animationType="fade" onRequestClose={() => setSelectedProvinceLogo(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedProvinceLogo(null)}>
            <View style={[styles.provinceLogoModal, isDark && styles.surfacePanelDark]}>
              {selectedProvinceLogo && provinceLogos[selectedProvinceLogo.province] ? <Image source={provinceLogos[selectedProvinceLogo.province]} style={styles.provinceLogoModalImage} /> : <Text style={styles.provinceLogoModalText}>{selectedProvinceLogo?.province.slice(0, 2).toUpperCase()}</Text>}
              <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{selectedProvinceLogo?.province}</Text>
            </View>
          </TouchableOpacity>
        </Modal>
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
              <TouchableOpacity style={styles.modalCloseButton} onPress={closeCommunityModal} activeOpacity={0.8}>
                <Ionicons name="close" size={22} color={palette.red} />
              </TouchableOpacity>
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
                      <Text style={[styles.communityModalMetaText, isDark && styles.textDarkBody]}>{province.locations.length} comunidades activas</Text>
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
                    <TouchableOpacity style={styles.locationIconButton} onPress={() => openCommunityLocation(community)} accessibilityLabel="Abrir ubicacion">
                      <Ionicons name="location-outline" size={22} color={palette.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.locationIconButton} onPress={() => { setShowContactBox(!showContactBox); setTimeout(() => contactScrollRef.current?.scrollToEnd({ animated: true }), 120); }} accessibilityLabel="Enviar mensaje">
                      <Ionicons name="chatbubble-outline" size={22} color={palette.white} />
                    </TouchableOpacity>
                  </View>
                  {showContactBox ? (
                    <View style={[styles.inlineEditorPanel, isDark && styles.surfacePanelDark]}>
                      <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Mensaje a animación/coordinación</Text>
                      {!session ? (
                        <>
                          <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Nombre</Text>
                          <TextInput style={styles.input} placeholder="Ej: Juan Perez" value={contactName} onChangeText={setContactName} onFocus={() => setTimeout(() => contactScrollRef.current?.scrollToEnd({ animated: true }), 160)} placeholderTextColor={inputPlaceholderColor} />
                          <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Contacto</Text>
                          <TextInput style={styles.input} placeholder="Ej: nombre@email.com o telefono" value={contactInfoValue} onChangeText={setContactInfoValue} onFocus={() => setTimeout(() => contactScrollRef.current?.scrollToEnd({ animated: true }), 160)} placeholderTextColor={inputPlaceholderColor} />
                        </>
                      ) : null}
                      <Text style={[styles.inputLabel, isDark && styles.textDarkStrong]}>Mensaje</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Escribi tu consulta para la comunidad"
                        value={contactMessage}
                        onChangeText={(value) => setContactMessage(value.slice(0, 500))}
                        onFocus={() => setTimeout(() => contactScrollRef.current?.scrollToEnd({ animated: true }), 160)}
                        multiline placeholderTextColor={inputPlaceholderColor} />
                      <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{contactMessage.length}/500</Text>
                      <TouchableOpacity style={styles.primaryButton} onPress={sendCommunityContactMessage}>
                        <Text style={styles.primaryButtonText}>Enviar mensaje</Text>
                      </TouchableOpacity>
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
        {(province.province === 'Tucuman' || province.province === 'Catamarca') ? (
          <>
            <SectionTitle title="Comunidades de jovenes" />
            {province.locations.filter((location) => location.group !== 'adultos').map((location) => renderCommunityRow(location, 'young'))}
            <SectionTitle title="Comunidades de adultos" />
            {province.locations.filter((location) => location.group === 'adultos').map((location) => renderCommunityRow(location, 'adult'))}
          </>
        ) : province.locations.map((location) => (
          renderCommunityRow(location)
        ))}
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <SectionTitle title={title} />
      <EditableIntro content={content} editor={editor} />
      {nearbySearchEnabled ? (
        <View style={[styles.card, isDark && styles.surfaceCardDark]}>
          <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>Buscar Comunidad mas cercana</Text>
          <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Usa tu ubicacion actual y muestra comunidades con coordenadas validas dentro de 5 km.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={searchNearestCommunity} disabled={nearestLoading} activeOpacity={0.86}>
            <Text style={styles.primaryButtonText}>{nearestLoading ? 'Buscando...' : 'Buscar comunidad cercana'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {visibleCommunityData.map((community) => (
        <TouchableOpacity key={community.province} style={[styles.card, styles.provinceCard, isDark && styles.surfaceCardDark]} onPress={() => setSelectedProvince(community.province)} activeOpacity={0.85}>
          <TouchableOpacity style={styles.provinceIcon} onPress={() => setSelectedProvinceLogo(community)} activeOpacity={0.85}>
            {provinceLogos[community.province] ? <Image source={provinceLogos[community.province]} style={styles.provinceLogoMiniImage} /> : <Text style={styles.provinceLogoMiniText}>{community.province.slice(0, 2).toUpperCase()}</Text>}
          </TouchableOpacity>
          <View style={styles.provinceBody}>
            <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>{community.region}</Text>
            <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{community.province}</Text>
            <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{community.description}</Text>
            <Text style={[styles.expandHint, isDark && styles.textDarkAccent]}>{community.locations.length} comunidades activas</Text>
          </View>
        </TouchableOpacity>
      ))}
      <Modal visible={Boolean(selectedProvinceLogo)} transparent animationType="fade" onRequestClose={() => setSelectedProvinceLogo(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedProvinceLogo(null)}>
          <View style={[styles.provinceLogoModal, isDark && styles.surfacePanelDark]}>
            {selectedProvinceLogo && provinceLogos[selectedProvinceLogo.province] ? <Image source={provinceLogos[selectedProvinceLogo.province]} style={styles.provinceLogoModalImage} /> : <Text style={styles.provinceLogoModalText}>{selectedProvinceLogo?.province.slice(0, 2).toUpperCase()}</Text>}
            <Text style={[styles.cardTitle, isDark && styles.textDarkStrong]}>{selectedProvinceLogo?.province}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={nearestModalVisible} transparent animationType="slide" onRequestClose={() => setNearestModalVisible(false)} statusBarTranslucent>
        <View style={styles.modalOverlay} pointerEvents="box-none">
          <Pressable style={styles.modalBackdropTouch} onPress={() => setNearestModalVisible(false)} />
          <View style={[styles.modalPanel, styles.communityModalPanel, isDark && styles.surfacePanelDark]} pointerEvents="auto">
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setNearestModalVisible(false)} activeOpacity={0.8}>
                <Ionicons name="close" size={22} color={palette.red} />
              </TouchableOpacity>
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
                    <Text style={[styles.cardEyebrow, isDark && styles.textDarkAccent]}>Mapa interactivo</Text>
                    <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Tu ubicacion: cerca de {nearestUserAddress || 'tu posicion actual'}</Text>
                    <Text style={[styles.cardText, isDark && styles.textDarkBody]}>Comunidad: {nearestResult.community.address}</Text>
                    <Text style={[styles.expandHint, isDark && styles.textDarkAccent]}>Tocar para abrir ruta interactiva</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={openNearestInMaps}>
                    <Text style={styles.primaryButtonText}>Abrir en Google Maps</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={[styles.cardText, isDark && styles.textDarkBody]}>{nearestMessage || 'No hemos encontrado una comunidad cerca de ti dentro de un radio de 5 km.'}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
