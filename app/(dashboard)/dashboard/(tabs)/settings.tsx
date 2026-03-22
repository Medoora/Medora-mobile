import { signOutUser } from '@/config/firebase/services/auth';
import React from 'react';
import { Button, StyleSheet, View } from 'react-native';

const settings = () => {
  const handleSignOut = async () => {
      try {
        await signOutUser();
        // Clear selected patient on logout
        localStorage.removeItem('selectedPatientId');
        window.location.href = "/sign-in";
       /*  toast.success(`${getCurrentUserWithData?.displayName} logout successfully`); */
      } catch (error) {
      /*   toast.error(`Logout failed ${error}`); */
        console.log("Logout failed",error);
      }
  };

  return (
    <View>
    <Button
     onPress={handleSignOut}
     title='logout'
     color={"red"}
    />
    </View>
  )
}

export default settings

const styles = StyleSheet.create({})