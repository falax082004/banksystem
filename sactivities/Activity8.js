import { StyleSheet, Text, View, Image, ScrollView } from 'react-native'
import React from 'react'
import Avatar from './assets/balagbag.jpg'


const App = () => {
  return (
    <>
    <View style={styles.container}>
      {/*Card Component*/}
      <View style={{flexDirection:'row'}}>
        <Image source={Avatar} style={styles.avatar}/>
        <View style={{width:10}}/>
        <Text style={{fontSize:18, color:'white',marginTop:10}}>Khurt Andrei Garcia</Text>
      </View>
      {/*Card Component*/}
    </View>

    <ScrollView>
      <View>
      <Text style={styles.justifiedText}>
  
  {'\t\t'}Lorem ipsum dolor sit amet, consectetur adipiscing elit.
  {'\n\n'} {/* Adds space between sections */}
  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.
  Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit euismod, vel pretium nisl ornare.
  Integer euismod, urna eu tincidunt congue, elit eros gravida nisl, id euismod ligula nulla et ligula.
  {'\n\n'} {/* Adds space between sections */}
  <Text style={styles.bullets}>• Lorem ipsum dolor sit amet, consectetur adipiscing elit. </Text>
  {'\n\n'} {/* Adds space between sections */}
  <Text style={styles.circleBullet}>○  Ut enim ad minim veniam, quis nostrud exercitation ullamco .</Text>
  {'\n\n'} {/* Adds space between sections */}
  <Text style={styles.squareBullet}>▪ Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu .</Text>
  {'\n\n'} {/* Adds space between sections */}
  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.
  Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit euismod, vel pretium nisl ornare.
  Integer euismod, urna eu tincidunt congue, elit eros gravida nisl, id euismod ligula nulla et ligula.
</Text>

      </View>
    </ScrollView>
    </>
  )
}

export default App

const styles = StyleSheet.create({
container:{
  width:'100%',
  height:200,
  justifyContent: 'center',
  alignItems:'center',
  backgroundColor:'gray',
  borderBottomLeftRadius:15,
  borderBottomEndRadius:15,

},
avatar:{
    width:80,
    height:80,
    resizeMode:'cover',
    borderRadius:50
},
justifiedText: {
  textAlign: 'justify',  // Justify the text
  fontSize: 16,
  color: 'black',
  marginBottom: 10,
},
bullets: {
  fontSize: 16,
  color: 'black',
  paddingLeft: 20,  // Add indentation for bullet points
},
circleBullet: {
  fontSize: 16,
  color: 'black',
  paddingLeft: 20,
  marginBottom: 5,
  borderRadius: 50,
  borderWidth: 1,
  borderColor: 'black',
  paddingRight: 10,  // Gives space between the bullet and text
  paddingTop: 3,
  paddingBottom: 3,
  marginRight: 10,
},
squareBullet: {
  fontSize: 16,
  color: 'black',
  paddingLeft: 20,
  marginBottom: 5,
  fontWeight: 'bold',
  fontFamily: 'sans-serif',
},
})
