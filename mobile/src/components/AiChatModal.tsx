import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookOpen,
  MapPin,
  Send,
  Sparkles,
  X,
} from 'lucide-react-native';
import {
  HeritageSite,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from '../types/heritage';
import {
  ChatCitation,
  ChatHistoryMessage,
  getOfflineAiChatFallbackMessage,
  sendAiChatMessage,
} from '../services/aiService';
import { COLORS, RADII, SERIF_FONT, SHADOWS, SPACING } from '../theme';

export interface AiChatModalProps {
  visible: boolean;
  selectedLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  contextSite?: HeritageSite | null;
  userLocation: [number, number];
  onClose: () => void;
  onOpenSiteById?: (siteId: string) => void;
}

interface ChatBubbleItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: ChatCitation[];
  mode?: 'gemini' | 'fallback' | 'offline';
}

function getDefaultQuestions(
  language: SupportedLanguage,
  siteName?: string
): string[] {
  if (siteName) {
    switch (language) {
      case 'en':
        return [
          `What are the architectural highlights of ${siteName}?`,
          `Opening hours and ticket price for ${siteName}?`,
          `Best local food near ${siteName}?`,
        ];
      case 'fr':
        return [
          `Quels sont les points forts architecturaux de ${siteName} ?`,
          `Horaires d'ouverture et tarif de ${siteName} ?`,
          `Où manger près de ${siteName} ?`,
        ];
      case 'zh':
        return [
          `${siteName}有哪些建筑亮点？`,
          `${siteName}的开放时间和门票价格是多少？`,
          `${siteName}附近有什么推荐美食？`,
        ];
      case 'ja':
        return [
          `${siteName}の建築の見どころは何ですか？`,
          `${siteName}の開館時間と入場料は？`,
          `${siteName}周辺のおすすめグルメは？`,
        ];
      default:
        return [
          `Kiến trúc của ${siteName} có điểm gì nổi bật?`,
          `Giờ mở cửa và giá vé tham quan ${siteName}?`,
          `Quanh ${siteName} có quán ăn nào ngon nhất?`,
        ];
    }
  }
  switch (language) {
    case 'en':
      return [
        'Which heritage sites in District 1 are closest for a walking tour?',
        'Which museums in Ho Chi Minh City are must-visit?',
        'Recommend great local restaurants near Ben Thanh Market.',
      ];
    case 'fr':
      return [
        'Quels sites patrimoniaux visiter à pied dans le 1er arrondissement ?',
        'Quels musées sont incontournables à Hô Chi Minh-Ville ?',
        'Quels restaurants recommandez-vous près du marché Ben Thanh ?',
      ];
    case 'zh':
      return [
        '第一郡有哪些适合步行游览的历史遗迹？',
        '胡志明市有哪些必去的博物馆？',
        '推荐滨城市场附近的特色美食餐厅。',
      ];
    case 'ja':
      return [
        '1区で徒歩で回れるおすすめ歴史スポットは？',
        'ホーチミン市で必見の博物館はどこですか？',
        'ベンタイン市場周辺のおすすめレストランを教えて。',
      ];
    default:
      return [
        'Gần Quận 1 có những di tích và bảo tàng nào đáng đi nhất?',
        'Gợi ý quán ăn ngon gần Dinh Độc Lập và Chợ Bến Thành?',
        'Di tích Quốc gia Đặc biệt ở TP.HCM gồm những địa điểm nào?',
      ];
  }
}

function getGreetingMessage(
  language: SupportedLanguage,
  siteName?: string
): string {
  if (siteName) {
    switch (language) {
      case 'en':
        return `Hello! I am your Heritage AI Guide. Ask me anything about ${siteName} — history, architecture, opening hours, or nearby dining.`;
      case 'fr':
        return `Bonjour ! Je suis votre guide IA du patrimoine. Posez-moi vos questions sur ${siteName} : histoire, architecture, horaires ou gastronomie.`;
      case 'zh':
        return `您好！我是智能遗产AI导游。欢迎询问关于「${siteName}」的历史、建筑特色、开放时间或周边美食。`;
      case 'ja':
        return `こんにちは！AI遺産ガイドです。「${siteName}」の歴史・建築・開館時間・周辺グルメについて何でも聞いてください。`;
      default:
        return `Xin chào! Tôi là Trợ lý AI Di sản. Bạn có thể hỏi tôi bất cứ điều gì về ${siteName} như lịch sử, điểm nhấn kiến trúc, giá vé hay quán ăn ngon gần đó.`;
    }
  }
  switch (language) {
    case 'en':
      return 'Hello! Ask me about any of the 50 Ho Chi Minh City heritage sites & attractions, walking itineraries, architecture, or nearby local food.';
    case 'fr':
      return 'Bonjour ! Posez-moi des questions sur les 50 sites historiques et attractions de Hô Chi Minh-Ville, les musées et les spécialités locales.';
    case 'zh':
      return '您好！您可以向我咨询胡志明市50处历史文化遗产与景点、博物馆、开放时间及周边特色美食。';
    case 'ja':
      return 'こんにちは！ホーチミン市の50の歴史遺産・観光名所、博物館、周辺グルメについて何でもご質問ください。';
    default:
      return 'Xin chào! Tôi là Trợ lý AI Hướng dẫn viên Di sản TP.HCM (RAG đa ngôn ngữ). Hãy hỏi về 50 di tích lịch sử, điểm tham quan, kiến trúc, giá vé hoặc quán ăn ngon gần bạn!';
  }
}

export const AiChatModal: React.FC<AiChatModalProps> = ({
  visible,
  selectedLanguage,
  onLanguageChange,
  contextSite,
  userLocation,
  onClose,
  onOpenSiteById,
}) => {
  const [scopedSite, setScopedSite] = useState<HeritageSite | null>(
    contextSite ?? null
  );
  const [inputText, setInputText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatBubbleItem[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  const scrollRef = useRef<React.ComponentRef<typeof ScrollView> | null>(null);

  const scopedSiteName = scopedSite
    ? (scopedSite.translations[selectedLanguage] || scopedSite.translations.vi)
        .name
    : undefined;

  useEffect(() => {
    if (!visible) return;
    setScopedSite(contextSite ?? null);
  }, [visible, contextSite]);

  useEffect(() => {
    if (!visible) return;
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: getGreetingMessage(selectedLanguage, scopedSiteName),
      },
    ]);
    setSuggestedQuestions(getDefaultQuestions(selectedLanguage, scopedSiteName));
  }, [visible, selectedLanguage, scopedSite?.id, scopedSiteName]);

  const handleSend = async (overrideQuestion?: string) => {
    const question = (overrideQuestion ?? inputText).trim();
    if (!question || isSending) return;

    const userMsg: ChatBubbleItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };

    const history: ChatHistoryMessage[] = messages
      .filter((m) => !m.id.startsWith('welcome-'))
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    if (!overrideQuestion) setInputText('');
    setIsSending(true);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);

    const res = await sendAiChatMessage({
      question,
      language: selectedLanguage,
      site_id: scopedSite?.id ?? null,
      lat: userLocation[0],
      lng: userLocation[1],
      history,
    });

    setIsSending(false);

    if (res.ok) {
      const botMsg: ChatBubbleItem = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: res.data.answer,
        citations: res.data.citations,
        mode: res.data.mode,
      };
      setMessages((prev) => [...prev, botMsg]);
      if (res.data.suggested_questions?.length) {
        setSuggestedQuestions(res.data.suggested_questions.slice(0, 3));
      }
    } else {
      const fallbackMsg: ChatBubbleItem = {
        id: `offline-${Date.now()}`,
        role: 'assistant',
        content: res.isOffline
          ? getOfflineAiChatFallbackMessage(selectedLanguage)
          : res.error,
        mode: 'offline',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerTitleCol}>
                <View style={styles.eyebrowRow}>
                  <Sparkles size={12} color={COLORS.accent} />
                  <Text style={styles.eyebrow}>
                    TRỢ LÝ AI HƯỚNG DẪN VIÊN RAG · 5 NGÔN NGỮ
                  </Text>
                </View>
                <Text style={styles.headerTitle}>Hỏi – Đáp Di sản AI</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityLabel="Đóng trợ lý AI"
                activeOpacity={0.75}
              >
                <X size={20} color={COLORS.ink} />
              </TouchableOpacity>
            </View>

            {/* Language Switcher + Site Context Chip */}
            <View style={styles.metaBar}>
              <View style={styles.langRow}>
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const active = selectedLanguage === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      onPress={() => onLanguageChange(lang.code)}
                      style={[styles.langBtn, active && styles.langBtnActive]}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.langBtnText,
                          active && styles.langBtnTextActive,
                        ]}
                      >
                        {lang.code.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {scopedSite && (
                <View style={styles.contextPill}>
                  <MapPin size={11} color={COLORS.accent} />
                  <Text style={styles.contextPillText} numberOfLines={1}>
                    {scopedSiteName}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setScopedSite(null)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <X size={12} color={COLORS.inkMuted} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Messages Feed */}
          <ScrollView
            ref={scrollRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.bubbleWrap,
                    isUser ? styles.bubbleWrapUser : styles.bubbleWrapBot,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isUser ? styles.bubbleUser : styles.bubbleBot,
                    ]}
                  >
                    {!isUser && msg.mode && (
                      <View style={styles.modeTag}>
                        <Sparkles size={10} color={COLORS.accent} />
                        <Text style={styles.modeTagText}>
                          {msg.mode === 'gemini'
                            ? 'Gemini RAG'
                            : msg.mode === 'fallback'
                              ? 'Tri thức cục bộ RAG'
                              : 'Chế độ Offline'}
                        </Text>
                      </View>
                    )}

                    <Text
                      style={[
                        styles.bubbleText,
                        isUser && styles.bubbleTextUser,
                      ]}
                    >
                      {msg.content}
                    </Text>

                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <View style={styles.citationsSection}>
                        <Text style={styles.citationsLabel}>
                          Nguồn trích dẫn:
                        </Text>
                        <View style={styles.citationsRow}>
                          {msg.citations.slice(0, 4).map((cit, idx) => (
                            <TouchableOpacity
                              key={`${cit.site_id}-${idx}`}
                              onPress={() => {
                                if (onOpenSiteById && cit.site_id) {
                                  onClose();
                                  onOpenSiteById(cit.site_id);
                                }
                              }}
                              style={styles.citationChip}
                              activeOpacity={0.75}
                            >
                              <BookOpen size={11} color={COLORS.accent} />
                              <Text
                                style={styles.citationChipText}
                                numberOfLines={1}
                              >
                                {cit.site_name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {isSending && (
              <View style={[styles.bubbleWrap, styles.bubbleWrapBot]}>
                <View style={[styles.bubble, styles.bubbleBot, styles.typingBox]}>
                  <ActivityIndicator size="small" color={COLORS.accent} />
                  <Text style={styles.typingText}>
                    Trợ lý AI đang truy xuất tri thức di sản...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* 3 Tappable Suggested Questions */}
          {suggestedQuestions.length > 0 && !isSending && (
            <View style={styles.suggestionsWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsRow}
              >
                {suggestedQuestions.slice(0, 3).map((q, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSend(q)}
                    style={styles.suggestionChip}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Composer */}
          <View style={styles.composerBar}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                selectedLanguage === 'vi'
                  ? 'Hỏi về lịch sử, kiến trúc, giờ mở cửa, ẩm thực...'
                  : 'Ask about heritage, architecture, hours, or food...'
              }
              placeholderTextColor={COLORS.inkMuted}
              style={styles.composerInput}
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
              editable={!isSending}
            />
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isSending}
              style={[
                styles.sendBtn,
                (!inputText.trim() || isSending) && styles.sendBtnDisabled,
              ]}
              accessibilityLabel="Gửi câu hỏi"
              activeOpacity={0.85}
            >
              <Send size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleCol: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: COLORS.accent,
  },
  headerTitle: {
    marginTop: 2,
    fontFamily: SERIF_FONT,
    fontSize: 19,
    fontWeight: '700',
    color: COLORS.ink,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  langRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    padding: 2,
    gap: 2,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.sm,
  },
  langBtnActive: {
    backgroundColor: COLORS.ink,
  },
  langBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.inkSecondary,
  },
  langBtnTextActive: {
    color: COLORS.white,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accentBorder,
    borderRadius: RADII.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    maxWidth: '58%',
  },
  contextPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
    flexShrink: 1,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  bubbleWrap: {
    flexDirection: 'row',
  },
  bubbleWrapUser: {
    justifyContent: 'flex-end',
  },
  bubbleWrapBot: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: RADII.lg,
    padding: SPACING.md,
    gap: SPACING.xs + 2,
  },
  bubbleUser: {
    backgroundColor: COLORS.ink,
    borderBottomRightRadius: RADII.xs,
  },
  bubbleBot: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: RADII.xs,
    ...SHADOWS.card,
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceMuted,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADII.xs,
  },
  modeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.inkSecondary,
  },
  bubbleText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: COLORS.ink,
  },
  bubbleTextUser: {
    color: COLORS.white,
  },
  citationsSection: {
    marginTop: 4,
    paddingTop: SPACING.xs + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 6,
  },
  citationsLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.inkMuted,
  },
  citationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  citationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  citationChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.ink,
    flexShrink: 1,
  },
  typingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  typingText: {
    fontSize: 12.5,
    color: COLORS.inkSecondary,
  },
  suggestionsWrap: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surfaceTint,
    paddingVertical: SPACING.sm,
  },
  suggestionsRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  suggestionChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADII.md,
    paddingHorizontal: 11,
    paddingVertical: 7,
    maxWidth: 240,
  },
  suggestionText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: COLORS.ink,
    lineHeight: 16,
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    ...SHADOWS.bar,
  },
  composerInput: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 13.5,
    color: COLORS.ink,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: RADII.md,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
});
