import React from 'react';
import { ImageBackground, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCommunityLocation } from '../../lib/remoteData';
import { APP_MESSAGES } from '../../lib/appMessages';
import { communityStyles } from './communityStyles';

export function CommunityHeader({
  community,
  province
}: {
  community?: AppCommunityLocation | null;
  province: string;
}) {
  const content = (
    <View style={communityStyles.heroOverlay}>
      <Text style={communityStyles.heroEyebrow}>{province || 'Palestra Argentina'}</Text>
      <Text style={communityStyles.heroTitle}>{community?.name || APP_MESSAGES.community.myCommunityTitle}</Text>
      {community?.description ? <Text style={communityStyles.heroDescription}>{community.description}</Text> : null}
      <View style={communityStyles.heroMeta}>
        <View style={communityStyles.heroMetaItem}>
          <Ionicons name="location-outline" size={15} color="#FFFFFF" />
          <Text style={communityStyles.heroMetaText}>{province || APP_MESSAGES.community.provinceFallback}</Text>
        </View>
        {community?.meetingDay || community?.meetingTime ? (
          <View style={communityStyles.heroMetaItem}>
            <Ionicons name="calendar-outline" size={15} color="#FFFFFF" />
            <Text style={communityStyles.heroMetaText}>
              {[community.meetingDay, community.meetingTime].filter(Boolean).join(' - ')}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  if (!community?.imageUrl) {
    return <View style={communityStyles.hero}>{content}</View>;
  }

  return (
    <ImageBackground
      source={{ uri: community.imageUrl }}
      style={communityStyles.hero}
      imageStyle={communityStyles.heroImage}
      resizeMode="cover"
    >
      {content}
    </ImageBackground>
  );
}
