import DashboardWrapper from '@/components/wrapper/dashboard-wrapper';
import { useAppTheme } from '@/context/theme-context';
import { Ionicons } from '@expo/vector-icons';
import * as MailComposer from 'expo-mail-composer';
import React from 'react';
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const HelpScreen = () => {
  const { isDark } = useAppTheme();

  // Theme-aware colors
  const bgColor = isDark ? 'bg-black' : 'bg-white';
  const cardBg = isDark ? 'bg-neutral-900' : 'bg-gray-100';
  const borderColor = isDark ? 'border-neutral-800' : 'border-gray-200';
  const textPrimary = isDark ? 'text-white' : 'text-black';
  const textSecondary = isDark ? 'text-neutral-400' : 'text-gray-500';
  const textTertiary = isDark ? 'text-neutral-500' : 'text-gray-400';
  const iconColor = isDark ? '#737373' : '#9ca3af';
  const supportHoursBg = isDark ? 'bg-neutral-900/50' : 'bg-gray-100/50';
  const linkColor = isDark ? 'text-blue-500' : 'text-blue-600';

  const handleEmailSupport = async () => {
    try {
      await MailComposer.composeAsync({
        recipients: ['support@medora.com'],
        subject: 'Medora App Support Request',
        body: 'Hello Medora Support Team,\n\nI need help with:\n\n\n\nBest regards,\n'
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to open email app. Please contact support@medora.com directly.');
    }
  };

  const handleCallSupport = () => {
    Alert.alert(
      'Contact Support',
      'Would you like to call support?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            Linking.openURL('tel:+918001234567');
          }
        }
      ]
    );
  };

  const handleOpenFAQ = () => {
    Linking.openURL('https://medora-web-kappa.vercel.app/faqs');
  };

  const handleOpenWhatsApp = () => {
    Linking.openURL('https://wa.me/917980240575?text=Hello%20Medora%20Support%2C%20I%20need%20help%20with...');
  };

  const faqs = [
    {
      question: 'How do I upload medical files?',
      answer: 'Tap the upload button (cloud icon) on Dashboard or My Drive screen, select a file or take a photo, fill in the details, and confirm upload.'
    },
    {
      question: 'What file types are supported?',
      answer: 'We support images (JPG, PNG, HEIC), PDFs, Word documents, Excel sheets, and DICOM medical imaging files.'
    },
    {
      question: 'How much storage do I get?',
      answer: 'Free users get 500 MB of storage. You can upgrade to premium plans for more storage space.'
    },
    {
      question: 'How do I restore a deleted file?',
      answer: 'Deleted files go to Trash. Open Trash from the bottom tabs, select the file, and tap restore.'
    },
    {
      question: 'How do I share files?',
      answer: 'Tap the three dots menu on any file, select Share, and choose how you want to share the file.'
    }
  ];

  return (
    <DashboardWrapper title="Help Center">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        className={`flex-1 ${bgColor}`}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View className="px-4 pt-4">
          {/* Header Section */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 bg-blue-500/20 rounded-full items-center justify-center mb-3">
              <Ionicons name="help-circle" size={40} color="#3b82f6" />
            </View>
            <Text className={`${textPrimary} text-xl font-bold`}>How can we help?</Text>
            <Text className={`${textSecondary} text-center mt-1`}>
              We're here to assist you with any questions or issues
            </Text>
          </View>

          {/* Quick Contact Cards */}
          <View className="flex-row flex-wrap gap-3 mb-8">
            <TouchableOpacity 
              onPress={handleEmailSupport}
              className={`flex-1 ${cardBg} p-4 rounded-xl border ${borderColor} items-center`}
            >
              <Ionicons name="mail" size={28} color={isDark ? "white" : "black"} />
              <Text className={`${textPrimary} font-medium mt-2`}>Email</Text>
              <Text className={`${textTertiary} text-xs`}>medoraht26@gmail.com</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleCallSupport}
              className={`flex-1 ${cardBg} p-4 rounded-xl border ${borderColor} items-center`}
            >
              <Ionicons name="call-outline" size={28} color="#3b82f6" />
              <Text className={`${textPrimary} font-medium mt-2`}>Call</Text>
              <Text className={`${textTertiary} text-xs`}>91+798024057</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleOpenWhatsApp}
              className={`flex-1 ${cardBg} p-4 rounded-xl border ${borderColor} items-center`}
            >
              <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
              <Text className={`${textPrimary} font-medium mt-2`}>WhatsApp</Text>
              <Text className={`${textTertiary} text-xs`}>Message us</Text>
            </TouchableOpacity>
          </View>

          {/* FAQ Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className={`${textPrimary} text-lg font-semibold`}>Frequently Asked Questions</Text>
              <TouchableOpacity onPress={handleOpenFAQ}>
                <Text className={`${linkColor} text-sm`}>View All</Text>
              </TouchableOpacity>
            </View>

            {faqs.map((faq, index) => (
              <View key={index} className={`${cardBg} rounded-xl p-4 mb-3 border ${borderColor}`}>
                <Text className={`${textPrimary} font-medium mb-2`}>{faq.question}</Text>
                <Text className={`${textSecondary} text-sm leading-5`}>{faq.answer}</Text>
              </View>
            ))}
          </View>

          {/* Resources Section */}
          <View className="mb-6">
            <Text className={`${textPrimary} text-lg font-semibold mb-4`}>Resources</Text>
            
            <TouchableOpacity 
              onPress={() => Linking.openURL('https://medora-web-kappa.vercel.app/')}
              className={`flex-row items-center justify-between ${cardBg} p-4 rounded-xl mb-2 border ${borderColor}`}
            >
              <View className="flex-row items-center">
                <Ionicons name="document-text-outline" size={22} color="#3b82f6" />
                <Text className={`${textPrimary} ml-3`}>User Guide</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => Linking.openURL('https://medora-web-kappa.vercel.app/')}
              className={`flex-row items-center justify-between ${cardBg} p-4 rounded-xl mb-2 border ${borderColor}`}
            >
              <View className="flex-row items-center">
                <Ionicons name="play-circle-outline" size={22} color="#3b82f6" />
                <Text className={`${textPrimary} ml-3`}>Video Tutorials</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => Linking.openURL('https://medora-web-kappa.vercel.app/')}
              className={`flex-row items-center justify-between ${cardBg} p-4 rounded-xl mb-2 border ${borderColor}`}
            >
              <View className="flex-row items-center">
                <Ionicons name="shield-outline" size={22} color="#3b82f6" />
                <Text className={`${textPrimary} ml-3`}>Privacy & Security</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={iconColor} />
            </TouchableOpacity>
          </View>

          {/* Support Hours */}
          <View className={`${supportHoursBg} rounded-xl p-4 mb-6 border ${borderColor}`}>
            <View className="flex-row items-center mb-2">
              <Ionicons name="time-outline" size={18} color={iconColor} />
              <Text className={`${textPrimary} ml-2 font-medium`}>Support Hours</Text>
            </View>
            <Text className={`${textSecondary} text-sm`}>Monday - Friday: 9:00 AM - 6:00 PM EST</Text>
            <Text className={`${textSecondary} text-sm mt-1`}>Saturday - Sunday: 10:00 AM - 4:00 PM EST</Text>
            <Text className={`${textTertiary} text-xs mt-2`}>Response time: Within 24 hours</Text>
          </View>

          {/* App Version */}
          <View className="items-center pb-8">
            <Text className={`${textTertiary} text-xs`}>Medora App v1.0.0</Text>
            <Text className={`${textTertiary} text-xs mt-1`}>© 2026 Medora. All rights reserved.</Text>
          </View>
        </View>
      </ScrollView>
    </DashboardWrapper>
  );
};

export default HelpScreen;