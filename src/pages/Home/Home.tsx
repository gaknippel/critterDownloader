import './Home.css'
import SplitText from '../../components/SplitText'

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

export default function Home() {
  return (
    <div className="home-page-wrapper">
            <SplitText
  text="Hello, you!"
  className="home-welcome"
  delay={15}
  duration={1.25}
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