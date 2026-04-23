import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { FONT } from '../styles/typography';
import { db, ref, onValue, off, get } from '../firebaseConfig';
import { useThemeMode } from '../theme/ThemeContext';

const PasabuyerInboxScreen = ({ navigation, route }) => {
  const { colors } = useThemeMode();
  const { userId } = route.params || {};
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    if (!userId) return;
    
    // Collect chat threads from riderDeliveries for this pasabuyer
    // Pasabuyers use the same riderDeliveries path as riders
    const pasabuyerDeliveriesRef = ref(db, `riderDeliveries/${userId}`);
    
    const unsub = onValue(pasabuyerDeliveriesRef, async (snap) => {
      if (!snap.exists()) { 
        setThreads([]); 
        return; 
      }
      
      const data = snap.val();
      const threadList = [];
      
      // Process each delivery/order
      for (const orderId of Object.keys(data)) {
        const order = { id: orderId, ...data[orderId] };
        
        // Check if there's a chat for this order
        const chatParticipantsRef = ref(db, `chats/${orderId}/participants`);
        const chatSnap = await get(chatParticipantsRef);
        
        // Only include if chat exists and pasabuyer is a participant
        if (chatSnap.exists() && chatSnap.val()[userId]) {
          // Get the shopper/user ID from the order
          const shopperId = order.userId || order.ownerId || null;
          
          // Get shopper name if available
          let shopperName = 'Shopper';
          if (shopperId) {
            try {
              const userRef = ref(db, `users/${shopperId}`);
              const userSnap = await get(userRef);
              if (userSnap.exists()) {
                const userData = userSnap.val();
                shopperName = userData.name || 'Shopper';
              }
            } catch (e) {
              // Use default name if fetch fails
            }
          }
          
          // Get last message for preview
          let lastMessage = null;
          let lastMessageTime = order.createdAt || new Date().toISOString();
          try {
            const messagesRef = ref(db, `chats/${orderId}/messages`);
            const messagesSnap = await get(messagesRef);
            if (messagesSnap.exists()) {
              const messages = messagesSnap.val();
              const messageKeys = Object.keys(messages);
              if (messageKeys.length > 0) {
                // Get the most recent message
                const sortedMessages = messageKeys
                  .map(k => ({ id: k, ...messages[k] }))
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                if (sortedMessages.length > 0) {
                  lastMessage = sortedMessages[0].text;
                  lastMessageTime = sortedMessages[0].createdAt;
                }
              }
            }
          } catch (e) {
            // Continue without last message preview
          }
          
          threadList.push({
            id: orderId,
            orderNumber: order.orderNumber || orderId,
            shopperId: shopperId,
            shopperName: shopperName,
            status: order.status || 'pending',
            totalAmount: order.totalAmount || 0,
            distanceKm: order.distanceKm || null,
            createdAt: order.createdAt || new Date().toISOString(),
            lastMessage: lastMessage,
            lastMessageTime: lastMessageTime,
          });
        }
      }
      
      // Sort by last message time (most recent first)
      threadList.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      setThreads(threadList);
    });
    
    return () => off(pasabuyerDeliveriesRef, 'value', unsub);
  }, [userId]);

  const openChat = (thread) => {
    navigation.navigate('Chat', { 
      orderId: thread.id, 
      userId, 
      viewerRole: 'pasabuyer',
      shopperId: thread.shopperId,
      riderId: userId,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.thread, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => openChat(item)}>
      <View style={styles.threadLeft}>
        <View style={styles.avatar}>
          <Icon name="comments" size={14} color="#fff" />
        </View>
      </View>
      <View style={styles.threadCenter}>
        <Text style={[styles.orderNumber, { color: colors.text }]}>Order #{item.orderNumber}</Text>
        <Text style={[styles.counterpart, { color: colors.mutedText }]}>Chat with {item.shopperName}</Text>
        {item.lastMessage && (
          <Text style={[styles.lastMessage, { color: colors.mutedText }]} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        )}
        <Text style={[styles.meta, { color: colors.mutedText }]}>
          ₱{item.totalAmount} • {item.status.replace('_', ' ')}
        </Text>
      </View>
      <View style={styles.threadRight}>
        <Icon name="chevron-right" size={14} color="#999" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Inbox</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>Messages with your shoppers</Text>
      </View>
      {threads.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="inbox" size={40} color="#bbb" />
          <Text style={[styles.emptyText, { color: colors.text }]}>No conversations yet</Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedText }]}>
            Start accepting pasabuy requests to begin chatting with shoppers
          </Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: { 
    padding: 20, 
    backgroundColor: '#fff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  title: { 
    fontSize: FONT.titleSize, 
    fontWeight: FONT.weightBold, 
    color: FONT.headerColor,
    marginBottom: 4,
  },
  subtitle: { 
    fontSize: FONT.subtitleSize, 
    color: FONT.mutedColor,
  },
  list: { 
    paddingHorizontal: 12, 
    paddingTop: 8 
  },
  thread: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 12, 
    marginVertical: 6 
  },
  threadLeft: { 
    width: 40, 
    alignItems: 'center' 
  },
  avatar: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#333', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  threadCenter: { 
    flex: 1, 
    paddingHorizontal: 8 
  },
  orderNumber: { 
    fontSize: FONT.bodySize, 
    fontWeight: '600', 
    color: FONT.headerColor 
  },
  counterpart: { 
    color: FONT.mutedColor, 
    fontSize: FONT.smallSize,
    marginTop: 2,
  },
  lastMessage: {
    color: FONT.secondaryMuted,
    fontSize: FONT.smallSize,
    marginTop: 4,
    fontStyle: 'italic',
  },
  meta: { 
    color: FONT.secondaryMuted, 
    fontSize: FONT.smallSize, 
    marginTop: 4 
  },
  threadRight: { 
    width: 24, 
    alignItems: 'flex-end' 
  },
  empty: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: { 
    color: FONT.headerColor, 
    marginTop: 12, 
    fontSize: FONT.bodySize,
    fontWeight: '600',
  },
  emptySubtext: {
    color: FONT.secondaryMuted,
    marginTop: 8,
    fontSize: FONT.smallSize,
    textAlign: 'center',
  },
});

export default PasabuyerInboxScreen;

