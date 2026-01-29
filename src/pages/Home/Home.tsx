import './Home.css'
import SplitText from '../../components/SplitText'
import steamHappy from '../../assets/steamHappy.gif'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fetch } from '@tauri-apps/plugin-http'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

export default function Home() {
  const navigate = useNavigate();
  const [patchNotes, setPatchNotes] = useState('loading patch notes...');

  useEffect(() => {
    const fetchPatchNotes = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/gaknippel/critterDownloader/main/patchNotes.md');
        const text = await response.text();
        console.log('success on getting patch notes!')
        setPatchNotes(text);
      } catch (error) {
        console.error('error fetching patch notes.', error)
        setPatchNotes('failed to get patch notes.')
      }
    };
    fetchPatchNotes();
  }, []); // Add empty dependency array so it only runs once

  return (
    <div className="home-page-wrapper">
      <div className="home-content">
        <SplitText
          text="welcome!"
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
      </div>

      <div className="patch-notes-container">
        <h2 className="patch-notes-title"><i>patch notes</i></h2>
        <ScrollArea className="h-[400px] md:h-[500px] rounded-md border p-4 text-left">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="markdown-h1" {...props} />,
              h2: ({node, ...props}) => <h2 className="markdown-h2" {...props} />,
              h3: ({node, ...props}) => <h3 className="markdown-h3" {...props} />,
              p: ({node, ...props}) => <p className="markdown-p" {...props} />,
              ul: ({node, ...props}) => <ul className="markdown-ul" {...props} />,
              ol: ({node, ...props}) => <ol className="markdown-ol" {...props} />,
              li: ({node, ...props}) => <li className="markdown-li" {...props} />,
              code: ({node, ...props}) => <code className="markdown-code" {...props} />,
              a: ({node, ...props}) => <a className="markdown-link" {...props} />,
            }}
          >
            {patchNotes}
          </ReactMarkdown>
        </ScrollArea>
      </div>
    </div>
  )
}