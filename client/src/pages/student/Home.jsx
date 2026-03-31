import React from 'react'
import Hero from '../../components/students/Hero.jsx'
import Companies from '../../components/students/Companies.jsx';
import CourseSection from '../../components/students/CoursesSection.jsx';
import TestimonialsSection from '../../components/students/TestimonialsSection.jsx';
import CallToAction from '../../components/students/CallToAction.jsx';
import Footer from '../../components/students/Footer.jsx';

const Home = () => {
  return (
    <div className='flex flex-col itens-center space-y-7 text-center'>
      <Hero/>
      <Companies/>
      <CourseSection/>
      <TestimonialsSection/>
      <CallToAction/>
      <Footer/>
    </div>
  )
}

export default Home;
