import { useRouter } from 'expo-router'
import React, { useEffect } from 'react'
import { Image, View } from 'react-native'

const index = () => {
    const router = useRouter()
    useEffect(() => {
    setTimeout(() => {
        router.replace('/welcome')
    }, 2000)
    },[])
  return (
      <View className='flex-1 justify-center bg-[#0056FF] items-center'>
       <Image 
        source={require('@/assets/icons/adaptive-icon.png')}
       resizeMode='contain'  className='w-[400px] h-[400px]'/> 
    </View> 
  )
}

export default index