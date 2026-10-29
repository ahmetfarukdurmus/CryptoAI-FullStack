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
  Animated,
  Easing,
} from 'react-native';
import { Send, Bot, Sparkles, User, Trash2 } from 'lucide-react-native';
import { typography, spacing, borderRadius } from '../../../shared/theme';
import { useTheme } from '../../../context/ThemeContext';
import { cryptoService } from '../../../services/api/cryptoService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  time: string;
}

const QUICK_PROMPTS = [
  'Bitcoin için kısa vadeli beklentin nedir?',
  'Kripto portföyü oluştururken riski nasıl dağıtmalıyım?',
  'Otopilot modu ve stop-loss mantığı nasıl çalışır?',
  'Şu an piyasada hangi coinler öne çıkıyor?',
];

/**
 * Yanıt üretilirken kullanıcıya modern zıplayan/parlayan 3 noktalı yazıyor animasyonu gösterir.
 */
const TypingDots: React.FC<{ color: string }> = ({ color }) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnim = (val: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 320,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 320,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true,
          }),
          Animated.delay(Math.max(0, 480 - delay)),
        ])
      );
    };

    const anim1 = createAnim(dot1, 0);
    const anim2 = createAnim(dot2, 160);
    const anim3 = createAnim(dot3, 320);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  const getDotStyle = (val: Animated.Value) => ({
    opacity: val.interpolate({
      inputRange: [0, 1],
      outputRange: [0.35, 1],
    }),
    transform: [
      {
        translateY: val.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -5],
        }),
      },
      {
        scale: val.interpolate({
          inputRange: [0, 1],
          outputRange: [0.85, 1.25],
        }),
      },
    ],
  });

  return (
    <View style={styles.typingDotsRow}>
      <Animated.View style={[styles.typingDot, { backgroundColor: color }, getDotStyle(dot1)]} />
      <Animated.View style={[styles.typingDot, { backgroundColor: color }, getDotStyle(dot2)]} />
      <Animated.View style={[styles.typingDot, { backgroundColor: color }, getDotStyle(dot3)]} />
    </View>
  );
};

export const AiChatScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'gemini',
      text: 'Merhaba! Ben CryptoAI platformunun Türkçe konuşan finans ve kripto danışmanıyım. Piyasa trendleri, coin analizleri veya portföy stratejileriniz hakkında dilediğinizi sorabilirsiniz.',
      time: 'Şimdi',
    },
  ]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async (textToSend?: string) => {
    const raw = textToSend !== undefined ? textToSend : inputMessage;
    const query = raw.trim();
    if (!query || loading) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      time: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);
    scrollToBottom();

    try {
      // Backend FastAPI /api/v1/chat/message endpoint'ine istek at
      const reply = await cryptoService.sendChatMessage(query);

      const geminiMsg: ChatMessage = {
        id: `gemini_${Date.now()}`,
        sender: 'gemini',
        text: reply,
        time: timeStr,
      };

      setMessages((prev) => [...prev, geminiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'gemini',
        text: `Hata oluştu: ${err?.message || 'Yapay zeka servisine erişilemedi.'}`,
        time: timeStr,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'gemini',
        text: 'Sohbet geçmişi temizlendi. Yeni sorularınızı yanıtlamaya hazırım!',
        time: 'Şimdi',
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Üst Başlık Barı */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.botIconWrap, { backgroundColor: 'rgba(0, 178, 254, 0.15)' }]}>
            <Bot size={22} color={colors.primary} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Yapay Zeka Danışmanı
              </Text>
              <View style={styles.badge}>
                <Sparkles size={11} color="#00B2FE" />
                <Text style={styles.badgeText}>gemini-2.0-flash</Text>
              </View>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              CryptoAI Finans & Kripto Danışmanı
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleClearChat}
          style={styles.clearBtn}
          hitSlop={10}
          title="Geçmişi Temizle"
        >
          <Trash2 size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Mesaj Listesi */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
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
                          backgroundColor: isDark ? '#111827' : '#F1F5F9',
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

        {/* Gemini Yanıt Hazırlıyor (Yazıyor Animasyonu) */}
        {loading && (
          <View style={[styles.messageRow, styles.messageRowGemini]}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
              <Sparkles size={14} color="#052914" />
            </View>
            <View
              style={[
                styles.loadingBubble,
                {
                  backgroundColor: isDark ? '#111827' : '#F1F5F9',
                  borderColor: colors.border,
                },
              ]}
            >
              <TypingDots color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Gemini yazıyor...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Hızlı Soru Hapları */}
      <View style={[styles.promptsContainer, { backgroundColor: colors.background }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promptsScroll}
        >
          {QUICK_PROMPTS.map((prompt, index) => (
            <Pressable
              key={index}
              style={[
                styles.promptPill,
                {
                  backgroundColor: isDark ? '#111827' : '#F1F5F9',
                  borderColor: colors.border,
                },
              ]}
              onPress={() => handleSend(prompt)}
              disabled={loading}
            >
              <Text style={[styles.promptText, { color: colors.textSecondary }]}>
                {prompt}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Mesaj Giriş Barı */}
      <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: isDark ? '#070B11' : '#F8FAFC',
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          placeholder="Finans veya kripto hakkında bir soru sor..."
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  botIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    ...typography.bodyBold,
    fontSize: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 178, 254, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B2FE',
  },
  headerSubtitle: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  clearBtn: {
    padding: spacing.xs,
  },
  messagesContainer: {
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '82%',
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
    lineHeight: 21,
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
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  loadingText: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: '500',
  },
  typingDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 16,
    paddingHorizontal: 2,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  promptsContainer: {
    paddingVertical: spacing.xs,
  },
  promptsScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  promptPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  promptText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  textInput: {
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
