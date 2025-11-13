import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
import { MapPin, Users, MessageCircle, Share2 } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';

interface EmptyStateMessageProps {
  onCreateReport: () => void;
  userLocation?: {
    latitude: number;
    longitude: number;
  } | null;
}

export default function EmptyStateMessage({ onCreateReport, userLocation }: EmptyStateMessageProps) {
  const handleShare = async () => {
    try {
      const message = 'Join me on Gorebet Civic App to report and track civic issues in our community!';
      const url = 'https://gorebet.app';

      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Gorebet Civic App',
            text: message,
            url: url,
          });
        } else {
          await navigator.clipboard.writeText(`${message} ${url}`);
          alert('Link copied to clipboard!');
        }
      } else {
        await Share.share({
          message: `${message} ${url}`,
        });
      }
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <MapPin size={48} color={LightTheme.accent} strokeWidth={1.5} />
        </View>

        <Text style={styles.title}>No Reports Nearby</Text>
        <Text style={styles.description}>
          There are no reported incidents within 1 km of your location.
          Be the first to contribute to your community!
        </Text>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onCreateReport}
            activeOpacity={0.8}
          >
            <MessageCircle size={20} color={LightTheme.white} strokeWidth={2} />
            <Text style={styles.primaryButtonText}>Create Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Share2 size={20} color={LightTheme.accent} strokeWidth={2} />
            <Text style={styles.secondaryButtonText}>Invite Neighbors</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Users size={16} color={LightTheme.secondaryText} />
          <Text style={styles.infoText}>
            Help build a more informed community by reporting and verifying civic issues
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '35%',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 5,
  },
  card: {
    backgroundColor: LightTheme.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: 'rgba(102, 126, 234, 0.2)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.1)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: LightTheme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: LightTheme.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LightTheme.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: 'rgba(63, 81, 181, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: LightTheme.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(63, 81, 181, 0.08)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(63, 81, 181, 0.2)',
  },
  secondaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: LightTheme.accent,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: LightTheme.secondaryText,
    lineHeight: 18,
  },
});
