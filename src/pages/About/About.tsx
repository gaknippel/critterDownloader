import './About.css'
import SplitText from '../../components/SplitText'
import { open } from '@tauri-apps/plugin-shell'
import { Github } from 'lucide-react'
import { Button } from '@/components/ui/button'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const items = [
  {
    value: "item-1",
    trigger: "it's not working!",
    content:
      "this app might have a lot of bugs, i mainly use it for myself, so if it works for me thats fine (sorry)",
  },
  {
    value: "item-2",
    trigger: "what is this app?",
    content:
      "this is a youtube downloader! sick of all those sketchy websites or paid subscriptions for a basic feature? use this!",
  },
  {
    value: "item-3",
    trigger: "how did i make this?",
    content:
      "this app was made with tauri, typescript + react, shadcnui, reactbits, ffmpeg, and yt-dlp.",
  },
]

const handleAnimationComplete = () => {
  console.log('All letters have animated!');
};

export default function About() {
  const handleGithubClick = async () => {
    try {
      await open('https://github.com/gaknippel');
    } catch (error) {
      console.error('Failed to open GitHub link:', error);
    }
  };

  return (
    <div className='about-page-wrapper'>
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
      <div className='accordion-container flex flex-col items-center gap-6'>
        <Accordion
          type="single"
          collapsible
          defaultValue="item-1"
          className="w-full"
        >
          {items.map((item) => (
            <AccordionItem key={item.value} value={item.value}>
              <AccordionTrigger>{item.trigger}</AccordionTrigger>
              <AccordionContent>{item.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="github-card mt-8 p-6 rounded-xl border bg-card/50 backdrop-blur-sm text-card-foreground shadow-md flex flex-col items-center gap-4 w-full text-center hover:shadow-lg transition-all duration-300">
          <div 
            className="p-3 bg-muted rounded-full text-foreground hover:scale-110 hover:bg-muted/80 transition-all duration-200 cursor-pointer shadow-inner" 
            onClick={handleGithubClick}
          >
            <Github size={32} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-semibold tracking-tight">developed by gaknippel</h3>
            <p className="text-sm text-muted-foreground">
              check out my github profile for more projects, updates, or to request stuff from me :D
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGithubClick} 
            className="gap-2 mt-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
          >
            <Github size={16} />
            github.com/gaknippel
          </Button>
        </div>
      </div>
    </div>
  )
}