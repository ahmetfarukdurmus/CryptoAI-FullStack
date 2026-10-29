import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Send, Bot, Sparkles, User, RefreshCw } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { useTheme } from '../../../context/ThemeContext';
import { cryptoService } from '../../../services/api/cryptoService';
import { useApp } from '../../../context/AppContext';

interface Message {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  time: string;
}

interface GeminiChatModalProps {
  visible: boolean;
  onClose: () => void;
  initialMessage?: string;
}

const QUICK_SUGGESTIONS = [
  'Portföyümü analiz et ve tavsiye ver',
  'Bitcoin için piyasa beklentin nedir?',
  'Riskimi düşürmek için ne yapmalıyım?',
  'Otopilot nasıl strateji uyguluyor?',
];

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({
  visible,
  onClose,
  initialMessage,
}) => {
  const { colors, isDark } = useTheme();
  const { portfolio } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'gemini',
      text: 'Merhaba! Ben CryptoAI platformunun Türkçe konuşan finans ve kripto danışmanıyım. Portföyünüz, piyasa trendleri, coin analizleri veya yatırım stratejileriniz hakkında dilediğinizi sorabilirsiniz.',
      time: 'Şimdi',
    },
  ]);

  useEffect(() => {
    if (visible && initialMessage) {
      handleSend(initialMessage);
    }
  }, [visible, initialMessage]);

  const handleSend = async (textToSend?: string) => {
    const raw = textToSend !== undefined ? textToSend : inputMessage;
    const query = raw.trim();
    if (!query || loading) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      time: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Backend'e portföy durumunu da katarak soruyu gönder
      const reply = await cryptoService.sendChatMessage(query);

      const geminiMsg: Message = {
        id: `gemini_${Date.now()}`,
        sender: 'gemini',
        text: reply,
        time: timeStr,
      };

      setMessages((prev) => [...prev, geminiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: `err_${Date.now()}`,
        sender: 'gemini',
        text: 'Bağlantı sırasında bir hata oluştu. Lütfen tekrar deneyiniz.',
        time: timeStr,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.modalContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Modal Başlık Barı */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.botIconCircle, { backgroundColor: 'rgba(0, 178, 254, 0.15)' }]}>
              <Bot size={20} color={colors.primary} />
            </View>
            <View>
              <View style={styles.badgeRow}>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                  Gemini Danışmanı
                </Text>
                <View style={styles.modelBadge}>
                  <Sparkles size={11} color="#00B2FE" />
                  <Text style={styles.modelBadgeText}>gemini-2.0-flash</Text>
                </View>
              </View>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                CryptoAI Finans & Portföy Danışmanı
              </Text>
            </View>
          </View>

          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
            <X size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Mesaj Listesi */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.messageRowUser : styles.messageRowGemini,
                ]}
              >
                {!isUser && (
                  <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                    <Sparkles size={14} color="#052914" />
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    isUser
                      ? [styles.bubbleUser, { backgroundColor: colors.primary }]
                      : [
                          styles.bubbleGemini,
                          {
                            backgroundColor: isDark ? '#131B2A' : '#F1F5F9',
                            borderColor: colors.border,
                          },
                        ],
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      { color: isUser ? '#052914' : colors.textPrimary },
                    ]}
                  >
                    {msg.text}
                  </Text>
                  <Text
                    style={[
                      styles.messageTime,
                      { color: isUser ? 'rgba(5, 41, 20, 0.7)' : colors.textMuted },
                    ]}
                  >
                    {msg.time}
                  </Text>
                </View>

                {isUser && (
                  <View
                    style={[
                      styles.avatarCircle,
                      { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' },
                    ]}
                  >
                    <User size={14} color={colors.textSecondary} />
                  </View>
                )}
              </View>
            );
          })}

          {/* Yanıt Yükleniyor Bildirimi */}
          {loading && (
            <View style={[styles.messageRow, styles.messageRowGemini]}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                <Sparkles size={14} color="#052914" />
              </View>
              <View
                style={[
                  styles.loadingBubble,
                  {
                    backgroundColor: isDark ? '#131B2A' : '#F1F5F9',
                    borderColor: colors.border,
                  },
                ]}
              >
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Gemini yazıyor...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Hızlı Öneri Hapları (Suggestions) */}
        <View style={styles.suggestionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
          >
            {QUICK_SUGGESTIONS.map((sug, index) => (
              <Pressable
                key={index}
                style={[
                  styles.suggestionPill,
                  {
                    backgroundColor: isDark ? '#111827' : '#F1F5F9',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleSend(sug)}
                disabled={loading}
              >
                <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                  {sug}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Mesaj Gönderme Giriş Barı */}
        <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#111827' : '#F8FAFC',
                color: colors.textPrimary,
                borderColor: colors.border,
              },
            ]}
            placeholder="Gemini'ye finans ve kripto sorusu sor..."
            placeholderTextColor={colors.textMuted}
            value={inputMessage}
            onChangeText={setInputMessage}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
            editable={!loading}
          />
          <Pressable
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary },
              (!inputMessage.trim() || loading) && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputMessage.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#052914" />
            ) : (
              <Send size={18} color="#052914" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalContainer: {
    width: '100%',
    height: '85%',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  botIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...typography.bodyBold,
    fontSize: 16,
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 178, 254, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B2FE',
  },
  headerSubtitle: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowGemini: {
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubbleGemini: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    ...typography.caption,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  loadingText: {
    ...typography.caption,
    fontSize: 13,
  },
  suggestionsContainer: {
    paddingVertical: spacing.xs,
  },
  suggestionsScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  suggestionPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
