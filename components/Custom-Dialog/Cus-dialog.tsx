import React from 'react'
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from 'react-native'
interface CustomDialogBoxProps {
     visible: boolean
     title?: string
     message?: string
     onConfirm?: () => void
     onCancel?: () => void
     loading?: boolean
     actionButtonName?: string
     cancelButtonName?: string
}
const CustomDialogBox = ({visible, title, message, onConfirm, onCancel, loading, actionButtonName, cancelButtonName}: CustomDialogBoxProps) => {
  return (
    <Modal
       visible={visible}
       transparent={true}
       animationType="fade"
       onRequestClose={onCancel}
     >
       <View className="flex-1 bg-black/70 justify-center items-center px-6">
         <View className="bg-neutral-900 rounded-2xl w-full max-w-sm p-6">
           <Text className="text-white text-lg font-semibold mb-2">{title}</Text>
           <Text className="text-neutral-400 text-sm mb-6">{message}</Text>
           <View className="flex-row gap-3">
             <TouchableOpacity
               onPress={onCancel}
               className="flex-1 py-3 rounded-xl bg-neutral-800"
             >
               <Text className="text-neutral-400 text-center font-medium">{cancelButtonName || "Cancel"}</Text>
             </TouchableOpacity>
             <TouchableOpacity
               onPress={onConfirm}
               disabled={loading}
               className={`flex-1 py-3 rounded-xl ${loading ? 'bg-blue-500/50' : 'bg-red-500'}`}
             >
               {loading ? (
                 <ActivityIndicator size="small" color="white" />
               ) : (
                 <Text className="text-white text-center font-medium">{actionButtonName || "Confirm"}</Text>
               )}
             </TouchableOpacity>
           </View>
         </View>
       </View>
     </Modal>
  )
}

export default CustomDialogBox