import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from '../../constants/theme';
import { PresetItem, CATEGORIES_BY_STORE_TYPE } from '../../types';
import { formatPrice } from '../../lib/receipt';
import { useTranslation } from '../../lib/i18n';
import { useShop, usePresetItems } from '../../lib/hooks';
import { EmptyState, SkeletonItemRow } from '../../components/ui';

export default function ItemsManagementScreen() {
  const { t, language } = useTranslation();
  const { shop } = useShop();
  const { items, loading, addItem, updateItem, deleteItem, refetch } = usePresetItems(shop?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PresetItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get categories based on store type
  const storeType = shop?.store_type || 'general';
  const categories = CATEGORIES_BY_STORE_TYPE[storeType];

  // Pull-to-refresh handler
  const onRefresh = async () => {
    if (!refetch) return;
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Form state
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState(categories[0]?.value || '');

  // Helper function to get translated category label
  const getCategoryLabel = (categoryValue: string) => {
    const category = categories.find(cat => cat.value === categoryValue);
    if (!category) return categoryValue;
    return language === 'th' ? category.labelTh : category.label;
  };

  // Filter items based on search and category
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Open modal for adding new item
  const handleAddItem = () => {
    setEditingItem(null);
    setFormName('');
    setFormPrice('');
    setFormCategory(categories[0]?.value || '');
    setModalVisible(true);
  };

  // Open modal for editing item
  const handleEditItem = (item: PresetItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormPrice(item.price.toString());
    setFormCategory(item.category || categories[0]?.value || '');
    setModalVisible(true);
  };

  // Save item (add or update)
  const handleSaveItem = async () => {
    if (!formName.trim()) {
      Alert.alert(t('error'), t('error_enter_item_name'));
      return;
    }

    const price = parseFloat(formPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert(t('error'), t('error_enter_price'));
      return;
    }

    try {
      if (editingItem) {
        // Update existing item
        await updateItem(editingItem.id, {
          name: formName,
          price,
          category: formCategory,
        });
      } else {
        // Add new item
        await addItem({
          name: formName,
          price,
          category: formCategory,
        });
      }

      setModalVisible(false);
    } catch (error) {
      console.error('Failed to save item:', error);
      Alert.alert(t('error'), 'Failed to save item. Please try again.');
    }
  };

  // Delete item with confirmation
  const handleDeleteItem = (item: PresetItem) => {
    Alert.alert(
      t('confirm_delete'),
      t('confirm_delete_item').replace('{name}', item.name),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(item.id);
            } catch (error) {
              console.error('Failed to delete item:', error);
              Alert.alert(t('error'), 'Failed to delete item. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Get category badge color using hash for consistent colors
  const getCategoryColor = (category?: string | null) => {
    if (!category) {
      return { bg: Colors.primaryMuted, text: Colors.primary };
    }

    const colorPalette = [
      { bg: '#DBEAFE', text: '#1E40AF' }, // Blue
      { bg: '#FEE2E2', text: '#991B1B' }, // Red
      { bg: '#FCE7F3', text: '#9F1239' }, // Pink
      { bg: '#D1FAE5', text: '#065F46' }, // Green
      { bg: '#FEF3C7', text: '#92400E' }, // Yellow
      { bg: '#E0E7FF', text: '#3730A3' }, // Indigo
      { bg: '#F3E8FF', text: '#6B21A8' }, // Purple
      { bg: '#FFEDD5', text: '#9A3412' }, // Orange
      { bg: '#CCFBF1', text: '#115E59' }, // Teal
      { bg: '#F1F5F9', text: '#475569' }, // Slate
    ];

    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colorPalette.length;
    return colorPalette[index];
  };

  const renderItem = ({ item }: { item: PresetItem }) => {
    const categoryColors = getCategoryColor(item.category);

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemContent}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemMeta}>
              <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
              {item.category && (
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: categoryColors.bg },
                  ]}
                >
                  <Text style={[styles.categoryBadgeText, { color: categoryColors.text }]}>
                    {getCategoryLabel(item.category)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.itemActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditItem(item)}
              activeOpacity={0.7}
              accessibilityLabel="Edit item"
              accessibilityRole="button"
            >
              <Ionicons name="pencil" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteItem(item)}
              activeOpacity={0.7}
              accessibilityLabel="Delete item"
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={18} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('items_management')}</Text>
        <TouchableOpacity
          style={styles.searchToggle}
          onPress={() => setIsSearchExpanded(!isSearchExpanded)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isSearchExpanded ? 'close' : 'search'}
            size={24}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {isSearchExpanded && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_items')}
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Category Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              !selectedCategory && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCategory(null)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                !selectedCategory && styles.filterChipTextActive,
              ]}
            >
              {t('all_categories')}
            </Text>
          </TouchableOpacity>

          {categories.map((category) => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.filterChip,
                selectedCategory === category.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(category.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === category.value && styles.filterChipTextActive,
                ]}
              >
                {language === 'th' ? category.labelTh : category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Items List */}
      {loading && items.length === 0 ? (
        <View>
          <SkeletonItemRow />
          <SkeletonItemRow />
          <SkeletonItemRow />
          <SkeletonItemRow />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title={t('no_items_found')}
              description={searchQuery || selectedCategory
                ? t('try_different_search')
                : t('start_adding_items')}
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddItem}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={32} color={Colors.white} />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? t('edit_item') : t('add_new_item')}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView
              style={styles.modalForm}
              showsVerticalScrollIndicator={false}
            >
              {/* Name Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('item_name_required')}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={t('item_name_placeholder')}
                  placeholderTextColor={Colors.textMuted}
                  value={formName}
                  onChangeText={setFormName}
                />
              </View>

              {/* Price Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('price_baht_required')}</Text>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.currencySymbol}>฿</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                    value={formPrice}
                    onChangeText={setFormPrice}
                  />
                </View>
              </View>

              {/* Category Selector */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('category')}</Text>
                <View style={styles.categoryGrid}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.value}
                      style={[
                        styles.categoryOption,
                        formCategory === category.value && styles.categoryOptionActive,
                      ]}
                      onPress={() => setFormCategory(category.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          formCategory === category.value && styles.categoryOptionTextActive,
                        ]}
                      >
                        {language === 'th' ? category.labelTh : category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonSecondaryText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={handleSaveItem}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonPrimaryText}>
                  {editingItem ? t('save') : t('add_item')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // Screen background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  searchToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  filtersContainer: {
    paddingBottom: Spacing.md,
  },
  filterScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary, // Primary blue
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary, // Gray text
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    minHeight: 60,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  itemPrice: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  itemActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary, // Primary blue for FAB
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl * 1.5,
    borderTopRightRadius: BorderRadius.xl * 1.5,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalForm: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  formInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingLeft: Spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencySymbol: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  priceInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    paddingRight: Spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryOptionText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryOptionTextActive: {
    color: Colors.white,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalButtonSecondary: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modalButtonPrimary: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.white,
  },
});
