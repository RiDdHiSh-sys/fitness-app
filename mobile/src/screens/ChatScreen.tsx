import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { useAppContext } from '../context/AppContext';
import { sendChatMessage, ChatMessage } from '../api/client';
import NeoInput from '../components/NeoInput';
import NeoButton from '../components/NeoButton';

const QUICK_QUESTIONS = [
  "What should I eat after my workout?",
  "How can I hit my protein goals?",
  "I'm feeling tired, what do you suggest?",
  "Best meal for muscle recovery?",
  "How much water should I drink?",
];

export default function ChatScreen() {
  const { user } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      content: `Hey ${user?.name ?? 'there'}! 👋 I'm your AI fitness coach. Ask me anything about your workouts, nutrition, or recovery!`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async (text: string = input) => {
    if (!text.trim() || !user || loading) return;
    const userMsg: ChatMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(user.user_id, text.trim(), messages);
      const aiMsg: ChatMessage = {
        role: 'ai',
        content: res.data.ai_reply,
        timestamp: new Date().toISOString(),
      };
      setMessages([...newHistory, aiMsg]);
    } catch (e) {
      const errMsg: ChatMessage = {
        role: 'ai',
        content: "Sorry, I couldn't reach the server. Please check your connection.",
        timestamp: new Date().toISOString(),
      };
      setMessages([...newHistory, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isAI = item.role === 'ai';
    return (
      <View style={[styles.msgRow, isAI ? styles.msgRowAI : styles.msgRowUser]}>
        {isAI && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isAI ? styles.bubbleAI : styles.bubbleUser,
          ]}
        >
          <Text style={[styles.bubbleText, !isAI && { color: Colors.textInverse }]}>
            {item.content}
          </Text>
          <Text style={[styles.timestamp, !isAI && { color: 'rgba(255,255,255,0.6)' }]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!isAI && (
          <View style={[styles.avatar, styles.avatarUser]}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.botAvatar}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Coach</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <View style={styles.quickSection}>
          <Text style={styles.quickLabel}>Quick Questions</Text>
          <FlatList
            horizontal
            data={QUICK_QUESTIONS}
            keyExtractor={(_, i) => String(i)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.xl }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.quickChip} onPress={() => sendMessage(item)}>
                <Text style={styles.quickChipText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderMessage}
        contentContainerStyle={styles.msgList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Typing Indicator */}
      {loading && (
        <View style={styles.typingRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
          <View style={[styles.bubble, styles.bubbleAI]}>
            <ActivityIndicator color={Colors.textSecondary} size="small" />
          </View>
        </View>
      )}

      {/* Input Row */}
      <View style={styles.inputRow}>
        <NeoInput
          placeholder="Ask your coach anything..."
          value={input}
          onChangeText={setInput}
          containerStyle={{ flex: 1, marginBottom: 0, marginRight: Spacing.sm }}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
          multiline
        />
        <NeoButton
          title="↑"
          onPress={() => sendMessage()}
          variant="primary"
          size="md"
          disabled={!input.trim() || loading}
          style={{ paddingHorizontal: 16 }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  botAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.purpleLight,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBlack, color: Colors.text },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.green },
  onlineText: { fontSize: Typography.fontSizeXS, color: Colors.green, fontWeight: Typography.fontWeightBold },

  quickSection: { paddingVertical: Spacing.md },
  quickLabel: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  quickChip: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    backgroundColor: Colors.accentLight,
    shadowColor: Colors.border,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  quickChipText: {
    fontSize: Typography.fontSizeSM,
    color: Colors.text,
    fontWeight: Typography.fontWeightMedium,
    maxWidth: 200,
  },

  msgList: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  msgRow: { flexDirection: 'row', marginBottom: Spacing.lg, alignItems: 'flex-end' },
  msgRowAI: { justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.purpleLight,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.sm,
  },
  avatarUser: { backgroundColor: Colors.primaryLight },
  avatarText: { fontSize: 16 },

  bubble: {
    maxWidth: '72%',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: Colors.border,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  bubbleAI: { backgroundColor: Colors.card, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: Typography.fontSizeMD, color: Colors.text, lineHeight: 21 },
  timestamp: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },

  typingRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
  },
});
