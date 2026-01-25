import './About.css'
import SplitText from '../../components/SplitText'

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

export default function About() {
  return (
    <div className="about-page-wrapper">
      <SplitText
        text="about this app"
        className="about-welcome-message"
        delay={15}
        duration={0.6}
        ease="power3.out"
        splitType="chars"
        from={{ opacity: 0, y: 40 }}
        to={{ opacity: 1, y: 0 }}
        threshold={0.1}
        rootMargin="-100px"
        textAlign="center"
        onLetterAnimationComplete={handleAnimationComplete}
      />
      
      <div className="about-content-box">
        <div className="about-section">
          <h3>whats this??</h3>
          <p>
            this is just a simple app to let you download youtube videos
            using yt-dlp and tauri rust api commands. you no longer have to
            youtube preimium or go on those sketchy "youtube to mp3" websites.
          </p>
        </div>
        
        <div className="about-section">
          <h3>how did i make this?</h3>
          <p>
            this was made using tauri, react, typescript, with shadcnui and reactbits.
          </p>
        </div>
        
        <div className="about-section">
          <h3>warning!</h3>
          <p>
            i might not update this app much!!! it's just a side project
          </p>
        </div>
      </div>
    </div>
  )
}