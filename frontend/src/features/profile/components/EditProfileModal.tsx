import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { User, X, Check } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { Input, Button } from '../../../shared/components';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose }) => {
  const { user, updateUserProfile } = useAuth();
  const { colors, isDark } = useTheme();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [user, visible]);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Lütfen hem ad hem soyad alanını doldurun.');
      return;
    }
    setError('');
    await updateUserProfile(firstName, lastName);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.container,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Başlık ve Kapat Butonu */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <User size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                Profili Düzenle
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? '#1C2738' : '#F1F5F9' },
              ]}
            >
              <X size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Hesabınızda ve ana ekranda görünecek ad ve soyadınızı güncelleyin.
          </Text>

          {/* Form Alanları */}
          <Input
            label="Ad"
            value={firstName}
            onChangeText={(t) => {
              setFirstName(t);
              setError('');
            }}
            placeholder="Adınızı girin"
          />

          <Input
            label="Soyad"
            value={lastName}
            onChangeText={(t) => {
              setLastName(t);
              setError('');
            }}
            placeholder="Soyadınızı girin"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Aksiyon Butonları */}
          <View style={styles.buttonRow}>
            <Button
              title="Vazgeç"
              variant="outline"
              onPress={onClose}
              style={styles.cancelBtn}
            />
            <Button
              title={isSaved ? 'Kaydedildi ✓' : 'Kaydet'}
              variant="primary"
              onPress={handleSave}
              style={styles.saveBtn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenPadding,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.h3,
    fontSize: 18,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  errorText: {
    ...typography.caption,
    color: '#FF3B30',
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 1.4,
  },
});
