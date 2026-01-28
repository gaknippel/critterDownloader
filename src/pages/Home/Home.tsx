import './Home.css'
import SplitText from '../../components/SplitText'
import steamHappy from '../../assets/steamHappy.gif'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page-wrapper">
        <SplitText
          text="welcome to critterDownloader!"
          className="home-welcome"
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
          <img src={steamHappy} alt="Steam Happy" style={{ display: "block", margin: "auto" }} />
          <div className="flex justify-center mt-4">
            <Button onClick={() => navigate('/download')}>
              go to the download page!
            </Button>
          </div>

          <div className="patch-notes-area mt-8">
            <h2 className="text-2xl font-bold mb-2">patch notes v1.0</h2>
            <ul className="list-disc list-inside">
              <li>can successfully download video & audio</li>
              <li>improved UI with SplitText animations</li>
            </ul>
          </div>
    </div>


  )
}