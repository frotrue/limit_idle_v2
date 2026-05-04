const fs = require('fs');
let content = fs.readFileSync('src/gameLogic.js', 'utf8');

content = content.replace(/game\.auto_upgrades\[0\]\.interval = 2000;[\s\S]*?export const performTier3Reset = \(\) => \{/, `game.auto_upgrades[0].interval = 2000;
    game.auto_upgrades[1].interval = 2000;
    game.auto_upgrades[2].interval = 5000;
    game.auto_upgrades[3].interval = 15000;
  }

  // 연구로 해금되지 않은 자동화만 비활성화 처리 (기존의 유저 설정 active 상태는 유지)
  game.auto_upgrades.forEach(auto => {
    if (!isAutoResearched(auto.id, game.ap_research)) {
      auto.active = false;
    }
  });

  makefx();
  saveGame();
};

export const performTier3Reset = () => {`);

fs.writeFileSync('src/gameLogic.js', content);
