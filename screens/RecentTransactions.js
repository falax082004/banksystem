import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { db, ref, get } from '../firebaseConfig';

const RecentTransactions = ({ userId }) => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const snapshot = await get(ref(db, `users/${userId}/transactions`));
        if (snapshot.exists()) {
          const transactionsData = snapshot.val();
          const recentTransactions = Object.values(transactionsData).reverse(); // to get latest transactions first
          setTransactions(recentTransactions);
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      }
    };

    fetchTransactions();
  }, [userId]);

  return (
    <View>
      <Text style={styles.header}>Recent Transactions</Text>
      {transactions.length > 0 ? (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.transaction}>
              <Text>{item.type} - ₱{item.amount}</Text>
              <Text>{item.date}</Text>
            </View>
          )}
        />
      ) : (
        <Text>No recent transactions</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  transaction: { padding: 10, borderBottomWidth: 1, borderColor: '#ddd' },
});

export default RecentTransactions;
