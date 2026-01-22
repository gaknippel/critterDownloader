import './About.css'


import SplitText from '../../components/SplitText'

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

export default function About() {
  return (
    <div className="about-page-wrapper" style={{ fontSize: 'clamp(2rem, 4vw, 4rem)' }}>
        <SplitText
          text="about this app"
          className="about-welcome-message"
          delay={15}
          duration={0.3}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="center"
          onLetterAnimationComplete={handleAnimationComplete}
          />
    </div>
  )
}