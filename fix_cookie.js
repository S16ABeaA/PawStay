import fs from 'fs';

let code = fs.readFileSync('src/components/CookieBanner.tsx', 'utf8');

code = code.replace(
  '                      <div className="mt-2 text-center">\\n                        <Link \\n                          to="/legal/privacy#cookies" \\n                          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"\\n                          onClick={() => setIsVisible(false)}\\n                        >\\n                          Read our Privacy Policy\\n                        </Link>\\n                      </div>',
  \`                      <div className="mt-2 text-center">
                        <Link 
                          to="/legal/privacy#cookies" 
                          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                          onClick={() => setIsVisible(false)}
                        >
                          Read our Privacy Policy
                        </Link>
                      </div>\`
);

code = code.replace(
  '                      <div className="mt-6 flex gap-2 justify-center">\\n                        <Button \\n                          variant="ghost" \\n                          size="icon"\\n                          title="Settings"\\n                          className="rounded-full text-muted-foreground" \\n                          onClick={() => setShowSettings(true)}\\n                          onMouseEnter={() => setHoveredBtn(\\'settings\\')}\\n                          onMouseLeave={() => setHoveredBtn(\\'none\\')}\\n                        >\\n                          <Settings2 className="h-5 w-5" />\\n                        </Button>',
  \`                      <div className="mt-6 flex flex-wrap gap-2 justify-center">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          title="Settings"
                          className="rounded-full text-muted-foreground hidden sm:flex" 
                          onClick={() => setShowSettings(true)}
                          onMouseEnter={() => setHoveredBtn('settings')}
                          onMouseLeave={() => setHoveredBtn('none')}
                        >
                          <Settings2 className="h-5 w-5" />
                        </Button>\`
);

fs.writeFileSync('src/components/CookieBanner.tsx', code);
