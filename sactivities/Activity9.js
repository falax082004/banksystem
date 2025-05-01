import { StyleSheet, Text, View, Image, ScrollView } from 'react-native';
import React from 'react';
import Avatar from './assets/balagbag.jpg';
import Fontisto from '@expo/vector-icons/Fontisto';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

const App = () => {
  return (
    <>
      <View style={styles.container}>
        {/* Card Component */}
        <View style={{ flexDirection: 'row' }}>
          <Image source={Avatar} style={styles.avatar} />
          <View style={{ width: 10 }} />
          <Text style={{ fontSize: 18, color: 'white', marginTop: 10 }}>
            Khurt Andrei Garcia
          </Text>
        </View>
        {/* Card Component */}
      </View>

      <ScrollView>
        <View style={{ borderWidth: 5, borderColor: 'red', borderRadius: 10, margin: 10 }}>
          {/* Make sure text is not empty */}
          <Fontisto name="email" size={32} color="green" style={{marginLeft:20}} /> 
          <Text style={styles.justifiedText}>
            {'\t\t'}A Bachelor of Science (BS) is an undergraduate academic degree awarded for completing a program of study in a science or technology-related field. This degree is designed to equip students with a comprehensive understanding of their chosen discipline, blending theoretical knowledge with practical applications.
            {'\n\n'} {/* Adds space between sections */}
            A BS degree typically emphasizes analytical thinking, problem-solving, and research skills. Students enrolled in a BS program gain extensive exposure to scientific methodologies, laboratory work, and hands-on experiences relevant to their field. The coursework generally includes a mix of foundational subjects, specialized electives, and capstone projects, all aimed at preparing students for real-world challenges.
            {'\n\n'} {/* Adds space between sections */}
            <Text style={styles.bullets}>• Emphasizes analytical and problem-solving skills essential for scientific and technical fields.</Text>
            {'\n\n'} {/* Adds space between sections */}
            <Text style={styles.circleBullet}>○ Prepares students for careers in industries such as engineering, computer science, healthcare, and environmental science.</Text>
            {'\n\n'} {/* Adds space between sections */}
            <Text style={styles.squareBullet}>▪ Incorporates laboratory work, research projects, and field studies to enhance practical expertise.</Text>
            {'\n\n'} {/* Adds space between sections */}
            Many BS programs also offer opportunities for internships, co-op programs, and collaborations with industry leaders, ensuring students gain valuable professional experience before entering the workforce. Graduates of BS programs may choose to pursue further studies, such as master's or doctoral degrees, to specialize in their area of interest and advance their careers.
          </Text>
        </View>

        <View style={{ height: 2, width: '100%', backgroundColor: 'gray' }} />

        <View style={{flexDirection:'row',marginLeft:20,marginTop:5}}>
          <FontAwesome5 name="wrench" size={28} color="green"  />
          <Text style={{fontSize:16, margin:4,fontWeight:'bold'}}>Edit Profile</Text>
          <View style={{width:'50%'}}/>
          <FontAwesome5 name="chevron-right" size={30} color='gray'/>
        </View>

        <View style={{height:2, width:'100%',backgroundColor:'gray'}}/>

      </ScrollView>
    </>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'gray',
    borderBottomLeftRadius: 15,
    borderBottomEndRadius: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    resizeMode: 'cover',
    borderRadius: 50,
  },
  justifiedText: {
    textAlign: 'justify', // Justify the text
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
});
