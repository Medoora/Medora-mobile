import { signOutUser } from '@/config/firebase/services/auth/auth';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const welcome = () => {
   const handleLogout = async () => {
  await signOutUser();
 
};
  return (
    <View className='flex h-screen bg-white justify-center items-center'>
     <TouchableOpacity
        onPress={async () => {
          console.log("🔍 Running network debug...");
         
        }}
        className="bg-zinc-800 py-3 px-4 rounded-xl"
      >
        <Text className="text-white text-center">Debug Network</Text>
      </TouchableOpacity>
       <TouchableOpacity
        onPress={handleLogout}
        className="bg-zinc-800 py-3 px-4 mt-10 rounded-xl"
      >
        <Text className="text-white text-center">Logout</Text>
      </TouchableOpacity>
    </View>
  )
}

export default welcome