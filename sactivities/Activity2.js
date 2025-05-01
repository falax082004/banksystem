import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const App = () => {
  return (
    <View style={mystyles.container}>
           <View style={mystyles.box1}>
           </View>
            <View style={mystyles.box2}>
            </View>
      <View style={mystyles.box2}>
      </View>
</View>
  )
}

export default App

const mystyles = StyleSheet.create({
container:{
  flex:1,
  justifyContent: 'flex-end',
  alignItems:'center'
},

box1:{
  backgroundColor:'green',
  width:80,
  height:80
},
box2:{
  backgroundColor:'yellow',
  width:80,
  height:80
},
box3:{
    backgroundColor:'red',
    width:80,
    height:80
},
})

