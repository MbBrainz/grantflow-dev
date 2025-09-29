# Lottie Animations

This directory contains Lottie animation JSON files used throughout the GrantFlow platform.

## Current Animations

- **grant-flow.json** - Sample animation used on the homepage hero section

## How to Replace with Your Own Animation

1. **Get a Lottie Animation:**
   - Create an animation in After Effects and export with Bodymovin plugin
   - Download animations from [LottieFiles.com](https://lottiefiles.com/)
   - Use online tools like [Lottie Creator](https://app.lottiefiles.com/editor)

2. **Replace the Animation:**
   - Save your new animation JSON file to this directory
   - Update the `animationPath` prop in the component where it's used
   - Example: `animationPath="/animations/your-animation.json"`

3. **Animation Requirements:**
   - File format: JSON
   - Recommended size: 800x600px or similar aspect ratio
   - Keep file size under 500KB for good performance
   - Test on different devices and screen sizes

## Usage Example

```tsx
import { LottieAnimation } from '@/components/ui/lottie-animation'

;<LottieAnimation
  animationPath="/animations/grant-flow.json"
  className="mx-auto h-full w-full max-w-lg"
  loop={true}
  autoplay={true}
/>
```

## Performance Tips

- Optimize animations for web (reduce complexity, keyframes)
- Use appropriate sizing to avoid loading large animations
- Consider loading states for slow connections
- Test animations on mobile devices for performance
