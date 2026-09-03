import { useState } from 'react';
import './App.scss';

import FlyingLogo from './components/FlyingLogo.jsx';
import AdvertisingText from './components/AdvertisingText.jsx';
import ScrollExpand from './components/ScrollExpand.jsx';
import FeaturesSection from './components/FeaturesSection.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import Differentials from './components/Differentials.jsx';
import NextSteps from './components/NextSteps.jsx';
import Footer from './components/Footer.jsx';
import heroImage from './assets/image.png';

function App() {
  const [hideLogo, setHideLogo] = useState(false);

  return (
    <>
      <FlyingLogo hidden={hideLogo} />
      <AdvertisingText />

      <div className="scroll-expand-wrapper">
        <ScrollExpand
          src={heroImage}
          title=""
          scrollHint="Scroll"
          useWindowScroll
          onVisibilityChange={setHideLogo}
        >
          <h1>Demonstração</h1>
        </ScrollExpand>
      </div>

      <FeaturesSection />
      <HowItWorks />
      <Differentials />
      <NextSteps />
      <Footer />
    </>
  )
}

export default App