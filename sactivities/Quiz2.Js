
import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import profileImage from './assets/PROFILE.jpg'; 

const ProfileCard = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Image 
          style={styles.profileImage} 
          source={profileImage}
        />
        
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.jobTitle}>Software Developer</Text>
        <Text style={styles.careerObjective}>
          Passionate about building web and mobile applications with modern technologies.
        </Text>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Contact Information</Text>
          <Text style={styles.contactItem}>Email: arvyecle89@gmail.com</Text>
          <Text style={styles.contactItem}>Phone: 09765437479</Text>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Personal Information</Text>
          <Text style={styles.detailsItem}>Date of Birth: September 14, 2004</Text>
          <Text style={styles.detailsItem}>Gender: Male</Text>
          <Text style={styles.detailsItem}>Address: Camella San Miguel, Sto. Tomas, Philippines</Text>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Education</Text>
          <Text style={styles.detailsItem}>Bachelor of Science in Computer Science, Faith Colleges, 2027</Text>
        </View>

        <View style={styles.skillsSection}>
          <Text style={styles.detailsTitle}>Skills</Text>
          <Text style={styles.skillsItem}>JavaScript, Java, C++, C#, HTML, CSS</Text>
        </View>

        <View style={styles.experienceSection}>
          <Text style={styles.experienceTitle}>Work Experience</Text>
          <Text style={styles.experienceItem}>Software Engineer at XYZ Corp (2032 - Present)</Text>
          <Text style={styles.experienceItem}>Junior Developer at ABC Inc. (2028 - 2031)</Text>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Achievements</Text>
          <Text style={styles.detailsItem}>Employee of the Year, XYZ Corp (2028)</Text>
        </View>

        <View style={styles.projectsSection}>
          <Text style={styles.detailsTitle}>Projects</Text>
          <Text style={styles.projectsItem}>Project 1: E-commerce Web App</Text>
          <Text style={styles.projectsItem}>Project 2: Mobile App for Social Media</Text>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Volunteer Experience</Text>
          <Text style={styles.detailsItem}>Volunteer Developer at Charity Organization (2017 - 2019)</Text>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Hobbies & Interests</Text>
          <Text style={styles.detailsItem}>Cycling, Camping, Traveling</Text>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Languages Spoken</Text>
          <Text style={styles.detailsItem}>English, Filipino</Text>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>Certifications</Text>
          <Text style={styles.detailsItem}>Certified React Developer</Text>
          <Text style={styles.detailsItem}>AWS Certified Solutions Architect</Text>
        </View>

        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>Social Media</Text>
          <TouchableOpacity>
            <Text style={styles.socialItem}>LinkedIn: linkedin.com/in/johndoe</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.socialItem}>GitHub: github.com/yoriichi_ii</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.socialItem}>Twitter: twitter.com/yoriichi_ii</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  jobTitle: {
    fontSize: 20,
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
  },
  careerObjective: {
    fontSize: 16,
    textAlign: 'center',
    color: '#777',
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

