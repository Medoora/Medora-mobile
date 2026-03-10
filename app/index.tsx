import { View, Text, Image } from 'react-native'
import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'

const index = () => {
    const router = useRouter()
    useEffect(() => {
    setTimeout(() => {
        router.replace('/welcome')
    }, 2000)
    },[])
  return (
      <View className='flex-1 justify-center items-center'>
       <Image 
        source={require('@/assets/logo/logo.png')}
       resizeMode='contain'  className='w-[400px] h-[400px]'/> 
    </View> 
  )
}

export default index