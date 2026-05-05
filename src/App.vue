<!--
Limit Idle
reference : gemini 3.1 and codex 5.3
github : frotrue/limit-idle
using tech : vue.js, break_eternity.js
made by frotrue
-->

<template>
  <div id="app" class="app-wrapper">
        <div class="container">
      <!-- 워프 인디케이터 배너 -->
      <div v-if="game.limit && game.limit.warp_active" class="warp-banner">
        🚀 점근적 시간 워프 가동 중! (목표 FV: {{ format(game.limit.warp_target_fv) }}) - 현재 게임 배속: x{{ game.limit.current_warp_mult.toLocaleString() }} 🚀
      </div>


      <!-- [상단 헤더] 현재 진행도 및 f(x) 수식 표시 -->
      <header class="header-card">
        <div class="label">CURRENT PROGRESS</div>
        <h1 class="resource-display">{{ format(game.fv) }}</h1>
        <div class="income-rate">f(x) = {{ game.fx_str }}</div>

        <div class="progress-section">
          <div class="progress-info">
            <span>X-Axis: {{ format(game.current_x) }} / {{ format(game.max_x) }}</span>
          </div>
        </div>
      </header>

      <!-- [네비게이션] 탭 메뉴 버튼 -->
      <nav class="tab-menu">
        <template v-for="tab in tabs" :key="tab.id">
          <button v-if="isTabVisible(tab.id)"
                  :class="{ active: activeTab === tab.id }"
                  @click="activeTab = tab.id">
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.name }}</span>
          </button>
        </template>
      </nav>

      <!-- [메인 콘텐츠 영역] 선택된 탭에 따라 내용 변경 -->
      <main class="main-content">
        
        <!-- 1. Variable 탭 (f(x) 관련 업그레이드) -->
        <div v-if="activeTab === 'fx'" class="tab-pane">
          <div class="section-header">
            <div class="section-title">Variable Upgrades</div>
            <button class="buy-max-btn" @click="Object.values(game.x_upgrades).reverse().forEach(u => buyMaxUpgrade(u))">BUY MAX</button>
          </div>
          <div class="upgrade-grid">
            <button v-for="upg in game.x_upgrades"
                    :key="upg.id"
                    class="upg-card-mini"
                    :class="{
                      'can-buy': game.fv.gte(upg.price),
                      'locked': game.fv.lt(upg.price)
                    }"
                    @click="buyUpgrade(upg)"
                    @contextmenu.prevent="buyMaxUpgrade(upg)">
              <div class="upg-name">{{ upg.name }}</div>
              <div class="upg-cost">
                <span class="cost-val">{{ format(upg.price) }}</span>
                <span class="cost-unit">FV</span>
              </div>
              <div class="upg-level">Lv.{{ upg.level }}</div>
            </button>
          </div>

          <br>
          
          <div class="section-header">
            <div class="section-title">Other Upgrades</div>
            <button class="buy-max-btn" @click="buyMaxAllOtherUpgrades('fx')">BUY MAX</button>
          </div>
          <div class="upgrade-grid">
            <template v-for="upg in game.other_upgrades" :key="upg.id">
              <button v-if="upg.type === 'fx'"
                      class="upg-card-mini"
                      :class="{
                        'can-buy': game.fv.gte(upg.price),
                        'locked': game.fv.lt(upg.price)
                      }"
                      @click="buyOtherUpgrade(upg)"
                      @contextmenu.prevent="buyMaxOtherUpgrade(upg)">
                <div class="upg-name">{{ upg.name }}</div>
                <div class="upg-cost">
                  <span class="cost-val">{{ format(upg.price) }}</span>
                  <span class="cost-unit">FV</span>
                </div>
                <div class="upg-level">Lv.{{ upg.level }}</div>
              </button>
            </template>
          </div>
        </div>

        <!-- 2. Derivative 탭 (환생 및 미분 보상) -->
        <div v-if="activeTab === 'fdx'" class="tab-pane">
          <div class="dx-header-card">
            <div class="label">DERIVATIVE POINTS</div>
            <div class="dx-resource-display">{{ format(game.dx_points) }} DX</div>
            <div class="exp-desc" style="margin-top: 5px; color: #88c0d0;">Automation Points: {{ format(game.ap_points) }} AP</div>
          </div>

          <div class="section-title">Differentiation</div>
          <div class="upgrade-grid">
            <button class="upg-card-mini full-row prestige-btn" @click="differentiate_bt">
              <div class="upg-name">Differentiate f(x)</div>
              <div class="upg-desc">Reset progress to gain DX points</div>
            </button>
          </div>

          <div class="section-header">
            <div class="section-title">Derivative Upgrades</div>
            <button class="buy-max-btn" @click="buyMaxAllOtherUpgrades('ddx')">BUY MAX</button>
          </div>
          <div class="upgrade-grid">
            <template v-for="upg in game.other_upgrades" :key="upg.id">
              <button v-if="upg.type === 'ddx'"
                      class="upg-card-mini"
                      :class="{
                        'can-buy': canAffordUpgrade(upg),
                        'locked': !canAffordUpgrade(upg)
                      }"
                      @click="buyOtherUpgrade(upg)"
                      @contextmenu.prevent="buyMaxOtherUpgrade(upg)">
                <div class="upg-name">{{ upg.name }}</div>
                <div class="upg-cost">
                  <span class="cost-val">{{ format(upg.price) }}</span>
                  <span class="cost-unit">{{ getUpgradeCurrencyLabel(upg) }}</span>
                </div>
                <div class="upg-level">Lv.{{ upg.level }}</div>
              </button>
            </template>
          </div>
        </div>

        <!-- 3. Automation 탭 -->
        <div v-if="activeTab === 'auto'" class="tab-pane">
          <div class="dx-header-card" style="margin-bottom: 12px;">
            <div class="label">AUTOMATION POINTS</div>
            <div class="dx-resource-display" style="font-size: 1.5rem;">{{ format(game.ap_points) }} AP</div>
            <div class="exp-desc" style="margin-top: 5px;">Differentiation Count: {{ format(game.differentiationCount) }}</div>
          </div>

          <nav class="tab-menu" style="margin-bottom: 12px;">
            <button :class="{ active: autoSubTab === 'automation' }" @click="autoSubTab = 'automation'">
              <span class="tab-label">자동화</span>
            </button>
            <button :class="{ active: autoSubTab === 'research' }" @click="autoSubTab = 'research'">
              <span class="tab-label">연구 트리</span>
            </button>
          </nav>

          <div v-if="autoSubTab === 'automation'">
            <!-- 해금된 자동화가 없을 때 안내 -->
            <div v-if="!game.ap_research.some(id => ['auto_function','auto_fv_utility','auto_dx_utility','auto_differentiate','auto_exp','auto_integral'].includes(id))"
                 class="stats-container" style="text-align: center; padding: 30px;">
              <div class="exp-desc" style="font-size: 1rem; color: #888;">🔒 해금된 자동화가 없습니다</div>
              <div class="exp-desc" style="margin-top: 8px;">연구 트리에서 자동화를 해금하세요!</div>
            </div>

            <!-- 기본 자동 업그레이드 (연구로 해금된 것만 표시) -->
            <template v-if="game.ap_research.some(id => ['auto_function','auto_fv_utility','auto_dx_utility','auto_differentiate'].includes(id))">
              <div class="section-title">⚙️ 기본 자동 업그레이드</div>
              <div class="upgrade-grid">
                <div v-for="auto in game.auto_upgrades" :key="auto.id"
                     v-show="isAutoNodeResearched(auto.id)"
                     class="upg-card-mini">
                  <div class="upg-name">{{ auto.name }}</div>
                  <div v-if="auto.targetType !== 'differentiate'" class="upg-level">Interval: {{ formatAutoInterval(auto.interval) }}</div>
                  <div v-else class="upg-level">Condition: {{ autoDiffConditionLabel }}</div>
                  <button class="sub-btn"
                          :style="{ backgroundColor: auto.active ? '#5e81ac' : '#1a1a1e', width: '100%' }"
                          @click="auto.active = !auto.active">
                    {{ auto.active ? 'ACTIVE' : 'INACTIVE' }}
                  </button>
                </div>
              </div>
            </template>

            <!-- 자동 미분 설정 (auto_differentiate 연구 해금 시) -->
            <div v-if="game.ap_research.includes('auto_differentiate')" class="stats-container" style="margin-top: 14px;">
              <div class="stats-item" style="display:block; border-bottom:none; padding-bottom:0;">
                <div class="stats-label" style="margin-bottom: 8px;">📉 Auto Differentiate Settings</div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <select v-model="game.auto_diff.mode" class="sub-input">
                    <option value="off">OFF (비활성)</option>
                    <option value="fv">FV 임계치</option>
                    <option value="dx">예상 DX 임계치</option>
                    <option value="either">FV 또는 DX 임계치</option>
                  </select>

                  <input
                    v-if="['fv', 'either'].includes(game.auto_diff.mode)"
                    v-model="game.auto_diff.fv_threshold"
                    class="sub-input"
                    type="text"
                    placeholder="FV threshold (예: 1e20)"
                  />

                  <input
                    v-if="['dx', 'either'].includes(game.auto_diff.mode)"
                    v-model="game.auto_diff.dx_threshold"
                    class="sub-input"
                    type="text"
                    placeholder="DX threshold (예: 1e6)"
                  />

                  <input
                    v-model.number="game.auto_diff.cooldown_ms"
                    class="sub-input"
                    type="number"
                    min="200"
                    step="100"
                    placeholder="Cooldown ms"
                  />

                  <div class="exp-desc">현재 설정: {{ autoDiffConditionLabel }}</div>
                </div>
              </div>
            </div>

            <!-- 자동 Tier 2 환생 (auto_exp 연구 해금 시) -->
            <div v-if="game.ap_research.includes('auto_exp')" class="stats-container" style="margin-top: 14px;">
              <div class="stats-item" style="display:block; border-bottom:none; padding-bottom:0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                  <div class="stats-label">📈 Auto Exponential Rebirth</div>
                  <button class="sub-btn"
                          :style="{ backgroundColor: game.auto_exp.active ? '#5e81ac' : '#1a1a1e', padding: '6px 14px', fontSize: '0.75rem' }"
                          @click="game.auto_exp.active = !game.auto_exp.active">
                    {{ game.auto_exp.active ? 'ON' : 'OFF' }}
                  </button>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <select v-model="game.auto_exp.mode" class="sub-input">
                    <option value="always">항상 (DX 충분 시)</option>
                    <option value="dx_threshold">DX 임계치 이상일 때</option>
                  </select>
                  <input v-if="game.auto_exp.mode === 'dx_threshold'" v-model="game.auto_exp.dx_threshold" class="sub-input" type="text" placeholder="DX threshold (예: 1e15)" />
                  <input v-model.number="game.auto_exp.cooldown_ms" class="sub-input" type="number" min="1000" step="1000" placeholder="쿨다운 (ms)" />
                  <div class="exp-desc">
                    모드: {{ game.auto_exp.mode === 'always' ? '항상' : `DX ≥ ${game.auto_exp.dx_threshold}` }}
                    / 쿨다운: {{ (game.auto_exp.cooldown_ms / 1000).toFixed(1) }}초
                  </div>
                </div>
              </div>
            </div>

            <!-- 자동 Tier 3 환생 (auto_integral 연구 해금 시) -->
            <div v-if="game.ap_research.includes('auto_integral')" class="stats-container" style="margin-top: 14px;">
              <div class="stats-item" style="display:block; border-bottom:none; padding-bottom:0;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                  <div class="stats-label">∫ Auto Integration</div>
                  <button class="sub-btn"
                          :style="{ backgroundColor: game.auto_integral.active ? '#5e81ac' : '#1a1a1e', padding: '6px 14px', fontSize: '0.75rem' }"
                          @click="game.auto_integral.active = !game.auto_integral.active">
                    {{ game.auto_integral.active ? 'ON' : 'OFF' }}
                  </button>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
                  <select v-model="game.auto_integral.mode" class="sub-input">
                    <option value="always">항상 (조건 충족 시)</option>
                    <option value="fv_threshold">FV 임계치 이상일 때</option>
                  </select>
                  <input v-if="game.auto_integral.mode === 'fv_threshold'" v-model="game.auto_integral.fv_threshold" class="sub-input" type="text" placeholder="FV threshold (예: 1e50)" />
                  <input v-model.number="game.auto_integral.cooldown_ms" class="sub-input" type="number" min="1000" step="1000" placeholder="쿨다운 (ms)" />
                  <div class="exp-desc">
                    모드: {{ game.auto_integral.mode === 'always' ? '항상' : `FV ≥ ${game.auto_integral.fv_threshold}` }}
                    / 쿨다운: {{ (game.auto_integral.cooldown_ms / 1000).toFixed(1) }}초
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div v-else>
            <div class="section-title">AP Research Tree</div>
            <div class="exp-desc" style="margin-bottom: 12px; color: #88c0d0;">영구적인 자동화 연구를 해금하세요. 환생으로 절대 사라지지 않습니다.</div>
            <div class="upgrade-grid">
              <div v-for="node in AP_RESEARCH_NODES" :key="node.id"
                   class="upg-card-mini"
                   :class="{
                     'research-unlocked': game.ap_research.includes(node.id),
                     'can-buy': !game.ap_research.includes(node.id) && canBuyResearch(node.id),
                     'locked': !game.ap_research.includes(node.id) && !canBuyResearch(node.id)
                   }"
                   style="position: relative;">
                <div class="upg-name">{{ node.icon }} {{ node.name }}</div>
                <div class="upg-desc" style="font-size: 0.75rem; color: #d8dee9; margin: 4px 0;">{{ node.desc }}</div>
                <div v-if="node.requires.length > 0" class="upg-desc" style="font-size: 0.65rem; color: #666; margin-bottom: 4px;">
                  선행: {{ node.requires.map(r => getResearchNodeName(r)).join(', ') }}
                </div>
                <div v-if="game.ap_research.includes(node.id)" class="upg-level" style="color: #a3be8c;">✔ 해금됨</div>
                <template v-else>
                  <div class="upg-cost">
                    <span class="cost-val">{{ node.cost }}</span>
                    <span class="cost-unit">AP</span>
                  </div>
                  <button class="sub-btn"
                          :style="{ width: '100%', marginTop: '6px', backgroundColor: canBuyResearch(node.id) ? '#5e81ac' : '#2e3440' }"
                          :disabled="!canBuyResearch(node.id)"
                          @click="buyResearch(node.id)">
                    {{ canBuyResearch(node.id) ? '연구 해금' : '조건 미충족' }}
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Exponential 탭 (지수 함수 레이어) -->
        <div v-if="activeTab === 'exp'" class="tab-pane">
          <div class="exp-header-card">
            <div class="label">EXPONENTIAL POWER (E)</div>
            <div class="exp-resource-display">^{{ format(new Decimal(game.exp_multiplier || 1).plus(getIntegralBonusValue().times(0.1))) }}</div>
            <div class="exp-desc">생산량 증폭: (f(x) + DX)^{{ format(new Decimal(game.exp_multiplier || 1).plus(getIntegralBonusValue().times(0.1))) }}</div>
            <div class="exp-desc" style="margin-top: 5px; color: #ff79c6;">기본 지수(E) = 1.0 + {{ format(game.exp_x) }} / 적분 보너스 = +{{ format(getIntegralBonusValue().times(0.1)) }}</div>
            <div class="exp-desc" style="margin-top: 5px; color: #88c0d0;">Tier2 마일스톤 포인트: {{ tier2MilestoneState.count }}</div>
          </div>

          <nav class="tab-menu" style="margin-bottom: 12px;">
            <button :class="{ active: expSubTab === 'rebirth' }" @click="expSubTab = 'rebirth'">
              <span class="tab-label">환생</span>
            </button>
            <button :class="{ active: expSubTab === 'milestones' }" @click="expSubTab = 'milestones'">
              <span class="tab-label">마일스톤</span>
            </button>
          </nav>

          <div v-if="expSubTab === 'rebirth'">
            <div class="section-title">Exponential Rebirth (Tier 2)</div>
            <div class="upgrade-grid">
              <button class="upg-card-mini full-row prestige-btn"
                      :class="{
                        'can-buy': game.dx_points.gte(game.exp_upgrades[0].price),
                        'locked': game.dx_points.lt(game.exp_upgrades[0].price)
                      }"
                      @click="buyExpUpgrade(game.exp_upgrades[0])">
                <div class="upg-name">{{ game.exp_upgrades[0].name }}</div>
                <div class="upg-desc">Increase exp_x by {{ expGainPreview() }} <br><span style="color:#bf616a; font-size:0.7em;">(모든 진행도 초기화)</span></div>
                <div class="upg-cost">
                  <span class="cost-val">{{ format(game.exp_upgrades[0].price) }}</span>
                  <span class="cost-unit">DX</span>
                </div>
                <div class="upg-level">Lv.{{ game.exp_upgrades[0].level }}</div>
              </button>
            </div>
          </div>

          <div v-else>
            <div class="section-header" style="margin-bottom: 10px;">
              <div class="section-title">Tier 2 Milestones (영구 유지)</div>
            </div>
            <div class="stats-container">
              <div v-for="ms in tier2MilestoneTable" :key="ms.id" class="stats-item" style="align-items: flex-start; flex-direction: column; gap: 4px;">
                <span class="stats-label">{{ ms.name }} - 포인트 {{ ms.at }}</span>
                <span class="exp-desc" style="color: #d8dee9;">{{ tier2MilestoneEffectText(ms.bonus) }}</span>
                <span class="stats-value" :style="{ color: ms.unlocked ? '#a3be8c' : '#bf616a' }">
                  {{ ms.unlocked ? '해금 완료' : `남은 포인트: ${ms.remaining}` }}
                </span>
              </div>
              <div v-if="tier2MilestoneState.next" class="exp-desc" style="margin-top: 10px; color: #ebcb8b;">
                다음 마일스톤: {{ tier2MilestoneState.next.name }} (포인트 {{ tier2MilestoneState.next.at }})
              </div>
            </div>
          </div>
        </div>

        <!-- 4.5. Integral 탭 (적분 3차 환생) -->
        <div v-if="activeTab === 'integral'" class="tab-pane">
          <div class="exp-header-card" style="background-color: #2F3241;">
            <div class="label" style="color: #A3BE8C;">INTEGRAL MULTIPLIER</div>
            <div class="exp-resource-display" style="color: #A3BE8C;">C = {{ format(getIntegralBonusValue()) }}</div>
            <div class="exp-desc">적분 효과: 영구 기본 지수 +{{ format(getIntegralBonusValue().times(0.1)) }} 증가</div>
            <div class="exp-desc" style="margin-top: 5px; color: #A3BE8C;">원함수는 DX/2x/지수 계산까지 반영된 값입니다.</div>
            <div class="exp-desc" style="margin-top: 5px; color: #A3BE8C;">적분 횟수: {{ game.integral_count }}회</div>
            <div class="exp-desc" style="margin-top: 5px; color: #88c0d0;">
              리셋 시작 보너스: +{{ format(tier3MilestoneState.bonuses.startFv) }} FV,
              +{{ format(tier3MilestoneState.bonuses.startXIncrease) }} x 증가,
              +{{ format(tier3MilestoneState.bonuses.startMaxX) }} Max x
            </div>
            <div class="exp-desc" style="margin-top: 5px; color: #a3be8c;">
              FV 생산 보너스: ×{{ format(tier3MilestoneState.bonuses.fvProductionMultiplier || 1) }}
            </div>
          </div>

          <nav class="tab-menu" style="margin-bottom: 12px;">
            <button :class="{ active: integralSubTab === 'rebirth' }" @click="integralSubTab = 'rebirth'">
              <span class="tab-label">환생</span>
            </button>
            <button :class="{ active: integralSubTab === 'milestones' }" @click="integralSubTab = 'milestones'">
              <span class="tab-label">마일스톤</span>
            </button>
          </nav>

          <div v-if="integralSubTab === 'rebirth'">
            <div class="section-title">Integration (Tier 3)</div>
            <div class="upgrade-grid">
              <button class="upg-card-mini full-row prestige-btn"
                      :class="{ locked: !canIntegrateNow }"
                      :disabled="!canIntegrateNow"
                      @click="integrate_bt"
                      style="background-color: rgb(32, 25, 30); border-color: #d08770; color: #d08770;">
                <div class="upg-name">Integrate ∫f(x)dx</div>
                <div class="upg-desc" style="color: #d08770;">Reset EVERYTHING (including DX and Exp) to gain Integral Constant C</div>
                <div v-if="!canIntegrateNow" class="upg-desc" style="font-size: 0.7rem; color: #bf616a; margin-top: 4px;">조건: Exp 증폭 1.50 이상</div>
              </button>
            </div>
          </div>

          <div v-else>
            <div class="section-header" style="margin-bottom: 10px;">
              <div class="section-title">Tier 3 Milestones</div>
            </div>
            <div class="stats-container" style="margin-bottom: 20px;">
              <div v-for="ms in tier3MilestoneTable" :key="ms.id" class="stats-item" style="align-items: flex-start; flex-direction: column; gap: 4px;">
                <span class="stats-label">{{ ms.name }} - 적분 {{ ms.at }}회</span>
                <span class="exp-desc" style="color: #d8dee9;">{{ milestoneEffectText(ms.bonus) }}</span>
                <span class="stats-value" :style="{ color: ms.unlocked ? '#a3be8c' : '#bf616a' }">
                  {{ ms.unlocked ? '해금 완료' : `남은 횟수: ${ms.remaining}` }}
                </span>
              </div>
              <div v-if="tier3MilestoneState.next" class="exp-desc" style="margin-top: 10px; color: #ebcb8b;">
                다음 마일스톤: {{ tier3MilestoneState.next.name }} (적분 {{ tier3MilestoneState.next.at }}회)
              </div>
            </div>
          </div>
        </div>

          <!-- 5. Shop 탭 -->
          <div v-if="activeTab === 'shop'" class="tab-pane">
            <div class="section-title">Shop</div>
            <div class="upgrade-grid">
              <div class="upg-card-mini full-row" :class="{ 'locked': game.is_2x_boost_owned }">
                <div class="upg-name">Permanent 2x Boost</div>
                <div class="upg-desc" style="font-size: 0.8rem; color: #aaa; margin: 5px 0;">영구적으로 f(x) 생산량이 2배 증가합니다.</div>
                <button class="sub-btn"
                        :style="{ width: '100%', marginTop: '10px', backgroundColor: game.is_2x_boost_owned ? '#4c566a' : '#5e81ac' }"
                        :disabled="game.is_2x_boost_owned"
                        @click="buyPermanentBoost">
                  {{ game.is_2x_boost_owned ? '구매 완료 (적용 중)' : '구매하기 ($0.99)' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 6. Stats 탭 -->
          <div v-if="activeTab === 'stats'" class="tab-pane">
            <div class="dx-header-card" style="margin-bottom: 12px; background-color: #3b4252;">
              <div class="label">STATISTICS & ACHIEVEMENTS</div>
              <div class="dx-resource-display" style="font-size: 1.2rem;">총 플레이 타임: {{ Math.floor(game.stats.play_time / 3600) }}h {{ Math.floor((game.stats.play_time % 3600) / 60) }}m {{ Math.floor(game.stats.play_time % 60) }}s</div>
            </div>

            <nav class="tab-menu" style="margin-bottom: 12px;">
              <button :class="{ active: statsSubTab === 'overview' }" @click="statsSubTab = 'overview'">
                <span class="tab-label">Overview</span>
              </button>
              <button :class="{ active: statsSubTab === 'graph' }" @click="statsSubTab = 'graph'">
                <span class="tab-label">Graph</span>
              </button>
              <button :class="{ active: statsSubTab === 'achievements' }" @click="statsSubTab = 'achievements'">
                <span class="tab-label">Achievements</span>
              </button>
            </nav>

            <div v-if="statsSubTab === 'overview'">
              <div class="section-title">Overview</div>
              <div class="stats-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="stats-item" style="flex-direction: column; align-items: flex-start; padding: 15px;">
                  <span class="stats-label" style="font-size: 0.8rem; color: #88c0d0;">Total FV Earned</span>
                  <span class="stats-value" style="font-size: 1.2rem;">{{ format(game.stats.total_fv) }}</span>
                </div>
                <div class="stats-item" style="flex-direction: column; align-items: flex-start; padding: 15px;">
                  <span class="stats-label" style="font-size: 0.8rem; color: #88c0d0;">Current FV/sec</span>
                  <span class="stats-value" style="font-size: 1.2rem;">{{ format(game.stats.fv_per_sec) }}</span>
                </div>
                <div class="stats-item" style="flex-direction: column; align-items: flex-start; padding: 15px;">
                  <span class="stats-label" style="font-size: 0.8rem; color: #88c0d0;">Differentiation Count</span>
                  <span class="stats-value" style="font-size: 1.2rem;">{{ format(game.differentiationCount) }}</span>
                </div>
                <div class="stats-item" style="flex-direction: column; align-items: flex-start; padding: 15px;">
                  <span class="stats-label" style="font-size: 0.8rem; color: #88c0d0;">Total DX Earned</span>
                  <span class="stats-value" style="font-size: 1.2rem;">{{ format(game.stats.total_dx) }}</span>
                </div>
              </div>
            </div>

            <div v-if="statsSubTab === 'graph'">
              <div class="section-title">Production History (FV/sec)</div>
              <div class="exp-desc" style="margin-bottom: 12px;">최근 1분간의 초당 FV 생산량 변화(Log Scale)입니다.</div>
              <LineChart :history="game.history.fv_per_sec" />
            </div>

            <div v-if="statsSubTab === 'achievements'">
              <div class="section-title">Achievements</div>
              <div class="exp-desc" style="margin-bottom: 12px; color: #a3be8c;">
                현재 달성한 업적: {{ game.achievements.length }} / {{ ACHIEVEMENTS.length }}<br>
                적용 중인 추가 배율: ×{{ format(getAchievementFvMultiplier(game.achievements)) }}<br>
                시작 기본 FV 보너스: +{{ format(getAchievementStartFv(game.achievements)) }}<br>
                미분 시 AP 보너스: +{{ format(getAchievementExtraAp(game.achievements)) }}
              </div>
              <div class="upgrade-grid">
                <div v-for="ach in ACHIEVEMENTS" :key="ach.id"
                     class="upg-card-mini"
                     :class="{
                       'research-unlocked': game.achievements.includes(ach.id),
                       'locked': !game.achievements.includes(ach.id)
                     }"
                     style="position: relative; opacity: 1;">
                  <div class="upg-name" :style="{ color: game.achievements.includes(ach.id) ? '#a3be8c' : '#d8dee9' }">
                    {{ game.achievements.includes(ach.id) ? '🏆' : '🔒' }} {{ ach.name }}
                  </div>
                  <div class="upg-desc" style="font-size: 0.75rem; color: #d8dee9; margin: 4px 0;">{{ ach.desc }}</div>
                  <div class="upg-desc" style="font-size: 0.7rem; color: #ebcb8b;">보상: {{ ach.reward }}</div>
                </div>
              </div>
            </div>
          </div>

          
          <!-- [Limit 탭] -->
          <div v-if="activeTab === 'limit'" class="tab-pane">
            <div class="dx-header-card" style="margin-bottom: 12px; background-color: #bf616a; color: white;">
              <div class="label">LIMIT: THE FINAL HORIZON</div>
              <div class="dx-resource-display" style="font-size: 1.4rem;">보유 LP: {{ format(game.limit.lp) }}</div>
              <div class="limit-passive-bonus" style="color: #eceff4; font-size: 1.1rem; margin-top: 8px;">
                보유 LP 패시브 시너지: FV 생산량 ×{{ format(getLpPassiveBonus(game.limit.lp)) }}
              </div>
            </div>

            <div v-if="canLimit(game.integral_count, game.fv)" class="limit-reset-box" style="padding: 20px; background: #3b4252; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 2px solid #d08770;">
              <h3 style="color: #d08770; margin-top: 0;">x → ∞</h3>
              <p style="color: #eceff4;">현재 상태로 극한에 도달할 수 있습니다.<br>
              수행 시 업적, 연구 트리, **그리고 모든 마일스톤(Tier 2 & 3)은 유지**되며 나머지 자원이 초기화됩니다.</p>
              <p style="color: #a3be8c; font-size: 1.2rem; font-weight: bold;">예상 획득 LP: +{{ format(getLpGain(game.fv)) }}</p>
              <button class="limit-reset-btn" @click="performLimitBtn">
                🌌 극한으로 향하기 (Limit Reset) 🌌
              </button>
            </div>
            <div v-else class="limit-reset-box" style="padding: 20px; background: #2e3440; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <p style="color: #4c566a;">극한에 도달하기 위해서는 적분 50회 이상이 필요합니다.<br>(현재 {{ game.integral_count }} / 50)</p>
            </div>

            <div class="section-title" style="color: #b48ead;">Transcendental Constants (초월 상수)</div>
            <div class="upgrade-grid">
              <div v-for="constant in LIMIT_CONSTANTS" :key="constant.id" class="upg-card">
                <div class="upg-name">{{ constant.name }} <span style="color: #88c0d0;">(Lv.{{ game.limit.constants[constant.id] || 0 }})</span></div>
                <div class="upg-desc">{{ constant.desc }}</div>
                <div class="upg-effect" style="color: #ebcb8b; margin: 5px 0;">현재 효과: {{ constant.effectDesc(game.limit.constants[constant.id] || 0) }}</div>
                <button class="limit-upgrade-btn" 
                        :disabled="game.limit.lp.lt(constant.price(game.limit.constants[constant.id] || 0))"
                        @click="buyLimitConstant(constant.id)">
                  업그레이드 (비용: {{ format(constant.price(game.limit.constants[constant.id] || 0)) }} LP)
                </button>
              </div>
            </div>
            
            <div class="section-title" style="margin-top: 20px; color: #bf616a;">L'Hôpital's Rule (로피탈의 정리 패시브)</div>
            <div class="upg-card" style="width: 100%; border: 1px solid #bf616a;">
              <div class="upg-name" style="color: #bf616a;">극한의 한계 돌파</div>
              <div class="upg-desc">성장이 정체되었을 때, 미분과 적분 횟수를 사용하여 거대한 배율로 치환합니다. (상수 총합 5레벨 이상부터 1 이상의 효과 적용)</div>
              <div class="upg-effect" style="color: #ebcb8b; font-size: 1.1rem;">
                현재 적용 배율: ×{{ format(getLpHospitalMultiplier(game.differentiationCount, game.integral_count, (game.limit.constants.euler_e||0) + (game.limit.constants.pi||0) + (game.limit.constants.gamma||0))) }}
              </div>
            </div>
          </div>

          <!-- [Settings 탭] -->
          <div v-if="activeTab === 'settings'" class="tab-pane">
            <div class="settings-group">
              <button class="sub-btn" @click="saveGame">SAVE GAME</button>
              <button class="sub-btn danger" @click="resetGame">RESET DATA</button>
            </div>
          </div>

        </main>

      <!-- 커스텀 알림 컴포넌트 -->
      <CustomAlert
        :visible="alertState.visible"
        :message="alertState.message"
        :title="alertState.title"
        :is-confirm="alertState.isConfirm"
        @close="handleAlertClose"
        @confirm="handleAlertConfirm"
        @cancel="handleAlertCancel"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import Decimal from 'break_eternity.js'
import CustomAlert from './components/CustomAlert.vue'
import LineChart from './components/LineChart.vue'

import {
  game, format, makefx, differentiate_bt,
  integrate_bt,
  buyUpgrade, buyOtherUpgrade, buyExpUpgrade,
  buyMaxUpgrade, buyMaxOtherUpgrade,
  buyMaxAllOtherUpgrades,
  getIntegralBonusValue, canIntegrate,
  getTier2MilestoneState, getTier2MilestoneTable,
  getTier3MilestoneState, getTier3MilestoneTable,
  purchaseResearch, getResearchState, AP_RESEARCH_NODES, ACHIEVEMENTS,
  setAlertCallbacks, manualTick, saveGame, loadGame, resetGame, LIMIT_CONSTANTS, getLpHospitalMultiplier, getLpGain, getLpPassiveBonus, canLimit, purchaseLimitConstant, performLimitReset
} from './gameLogic.js'

import { getAchievementFvMultiplier, getAchievementExtraAp, getAchievementStartFv } from './achievements.js'

const PRODUCT_2X_BOOST = 'fv_permanent_x2';
const PRODUCT_2X_BOOST_ALT = 'fv-permanent-x2';


const isTabVisible = (tabId) => {
  if (tabId === 'exp') return game.unlocked_exp;
  if (tabId === 'integral') return game.unlocked_integral;
  if (tabId === 'limit') return game.integral_count >= 50 || (game.limit && game.limit.limit_count > 0);
  return true;
}

const activeTab = ref('fx')
const performLimitBtn = () => {
  if (confirm("정말 극한(Limit)에 도달하시겠습니까? 업적과 AP 연구를 제외한 모든 것이 초기화됩니다!")) {
    performLimitReset()
    activeTab.value = 'fx'
  }
}
const buyLimitConstant = (id) => purchaseLimitConstant(id)

const autoSubTab = ref('automation')
const expSubTab = ref('rebirth')
const integralSubTab = ref('rebirth')
const statsSubTab = ref('overview')
const canIntegrateNow = computed(() => canIntegrate())
const tier2MilestoneState = computed(() => getTier2MilestoneState())
const tier2MilestoneTable = computed(() => getTier2MilestoneTable())
const tier3MilestoneState = computed(() => getTier3MilestoneState())
const tier3MilestoneTable = computed(() => getTier3MilestoneTable())

import { canPurchaseResearch, isAutoResearched, AUTO_RESEARCH_MAP } from './apResearch.js'

const canBuyResearch = (nodeId) => canPurchaseResearch(nodeId, game.ap_research, game.ap_points)
const isAutoNodeResearched = (autoId) => isAutoResearched(autoId, game.ap_research)

const buyResearch = (nodeId) => {
  if (purchaseResearch(nodeId)) {
    const node = AP_RESEARCH_NODES.find(n => n.id === nodeId)
    if (node) showAlert(`${node.icon} ${node.name} 연구가 해금되었습니다!\n효과: ${node.desc}`, '연구 해금')
  }
}

const getResearchNodeName = (nodeId) => {
  const node = AP_RESEARCH_NODES.find(n => n.id === nodeId)
  return node ? node.name : nodeId
}
const autoDiffConditionLabel = computed(() => {
  const mode = game.auto_diff?.mode || 'dx'
  const fv = game.auto_diff?.fv_threshold || '1e20'
  const dx = game.auto_diff?.dx_threshold || '1e6'
  const cooldown = Math.max(200, Number(game.auto_diff?.cooldown_ms || 1500))

  if (mode === 'off') return `OFF / 쿨다운 ${cooldown}ms`
  if (mode === 'fv') return `FV >= ${fv} / 쿨다운 ${cooldown}ms`
  if (mode === 'dx') return `예상 DX >= ${dx} / 쿨다운 ${cooldown}ms`
  return `FV >= ${fv} 또는 예상 DX >= ${dx} / 쿨다운 ${cooldown}ms`
})

const expGainPreview = () => {
  const base = 0.05
  return (base + (tier2MilestoneState.value.bonuses.extraExpX || 0)).toFixed(2)
}

const tier2MilestoneEffectText = (bonus = {}) => {
  const chunks = []
  if (bonus.extraExpX) chunks.push(`Exp 구매당 exp_x +${bonus.extraExpX.toFixed(2)}`)
  if (bonus.expPriceMultiplier) chunks.push(`Exp 업그레이드 가격 x${Number(bonus.expPriceMultiplier).toFixed(2)}`)
  if (bonus.apGainMultiplier) chunks.push(`미분 AP 획득 x${Number(bonus.apGainMultiplier).toFixed(2)}`)
  if (bonus.xUpgradePriceMultiplier) chunks.push(`Variable 업그레이드 가격 x${Number(bonus.xUpgradePriceMultiplier).toFixed(2)}`)
  if (bonus.fxUpgradePriceMultiplier) chunks.push(`Variable 기타 업그레이드 가격 x${Number(bonus.fxUpgradePriceMultiplier).toFixed(2)}`)
  if (bonus.startFv) chunks.push(`환생 시작 FV +${format(bonus.startFv)}`)
  if (bonus.startXUpgradeLevels) {
    const levels = Object.keys(bonus.startXUpgradeLevels)
      .map((id) => `x${id} Lv+${bonus.startXUpgradeLevels[id]}`)
      .join(', ')
    if (levels) chunks.push(`시작 레벨 보너스: ${levels}`)
  }
  if (bonus.permanentAutoUnlock) chunks.push('자동 업그레이드 영구 잠금 해제')
  if (bonus.autoUpgradeUsesMaxBuy) chunks.push('자동 업그레이드가 Buy Max 방식으로 동작')
  return chunks.join(' / ') || '보상 없음'
}

const milestoneEffectText = (bonus = {}) => {
  const chunks = []
  if (bonus.startFv) chunks.push(`시작 FV +${format(bonus.startFv)}`)
  if (bonus.startXIncrease) chunks.push(`시작 x 증가 +${format(bonus.startXIncrease)}`)
  if (bonus.startMaxX) chunks.push(`시작 Max x +${format(bonus.startMaxX)}`)
  if (bonus.fvProductionMultiplier) chunks.push(`FV 생산량 x${Number(bonus.fvProductionMultiplier).toFixed(2)}`)
  return chunks.join(' / ') || '보상 없음'
}

const formatAutoInterval = (intervalMs) => {
  const ms = Number(intervalMs || 0)
  if (ms > 0 && ms < 100) return 'per tick'
  return `${(ms / 1000).toFixed(1)}s`
}

const getUpgradeCurrencyLabel = (upg) => {
  if (upg.currency) return upg.currency
  if (upg.type === 'ddx') return 'DX'
  if (upg.type === 'fx') return 'FV'
  return 'FV'
}

const canAffordUpgrade = (upg) => {
  const currency = getUpgradeCurrencyLabel(upg)
  if (currency === 'AP') return game.ap_points.gte(upg.price)
  if (currency === 'DX') return game.dx_points.gte(upg.price)
  return game.fv.gte(upg.price)
}

// 알림 상태 관리
const alertState = reactive({
  visible: false,
  message: '',
  title: '',
  isConfirm: false,
  onConfirm: () => {},
  onCancel: () => {}
})

const resetAlertCallbacks = () => {
  alertState.onConfirm = () => {}
  alertState.onCancel = () => {}
}

const handleAlertClose = () => {
  alertState.visible = false
  alertState.isConfirm = false
  resetAlertCallbacks()
}

const handleAlertConfirm = () => {
  const cb = alertState.isConfirm ? alertState.onConfirm : null
  handleAlertClose()
  if (typeof cb === 'function') cb()
}

const handleAlertCancel = () => {
  const cb = alertState.isConfirm ? alertState.onCancel : null
  handleAlertClose()
  if (typeof cb === 'function') cb()
}

const showAlert = (message, title = '알림') => {
  alertState.message = message
  alertState.title = title
  alertState.isConfirm = false
  resetAlertCallbacks()
  alertState.visible = true
}

const showConfirm = (message, onConfirm, title = '확인') => {
  alertState.message = message
  alertState.title = title
  alertState.isConfirm = true
  alertState.onConfirm = typeof onConfirm === 'function' ? onConfirm : () => {}
  alertState.onCancel = () => {}
  alertState.visible = true
}

// 게임 로직에 알림 콜백 주입
setAlertCallbacks(showAlert, showConfirm);

const tabs = [
  { id: 'fx', name: 'Variable', icon: '🧮' },
  { id: 'fdx', name: 'Derivative', icon: '📉' },
  { id: 'auto', name: 'Automation', icon: '⚙️' },
  { id: 'exp', name: 'Exponential', icon: '📈' },
  { id: 'integral', name: 'Integral', icon: '∫' },
  { id: 'limit', name: 'Limit', icon: '🛑' },
  { id: 'shop', name: 'Shop', icon: '🛒' },
  { id: 'stats', name: 'Stats', icon: '📊' },
  { id: 'settings', name: 'Settings', icon: '⚙️' }
]

const initStore = () => {
  const CdvPurchase = window.CdvPurchase;
  if (!CdvPurchase) {
    console.warn("CdvPurchase is not defined.");
    return;
  }

  const { store, ProductType, Platform, LogLevel } = CdvPurchase;

  // 1. 디버그 로그 (개발 중에는 DEBUG, 배포 시에는 ERROR 권장)
  store.verbosity = LogLevel.DEBUG;

  // 2. 상품 등록
  store.register([{
    id: PRODUCT_2X_BOOST,
    type: ProductType.NON_CONSUMABLE,
    platform: Platform.GOOGLE_PLAY
  }, {
    id: PRODUCT_2X_BOOST,
    type: ProductType.NON_CONSUMABLE,
    platform: Platform.APPLE_APPSTORE
  }, {
    // Alternative ID for the same product
    id: PRODUCT_2X_BOOST_ALT,
    type: ProductType.NON_CONSUMABLE,
    platform: Platform.GOOGLE_PLAY
  }, {
    id: PRODUCT_2X_BOOST_ALT,
    type: ProductType.NON_CONSUMABLE,
    platform: Platform.APPLE_APPSTORE
  }]);

  // 3. 결제 승인 핸들러
  store.when().approved(transaction => {
    console.log("Transaction approved:", transaction);
    transaction.verify();
  });

  // 4. 검증 완료 및 아이템 지급
  store.when().verified(receipt => {
    console.log("Transaction verified:", receipt);
    receipt.finish(); // 반드시 호출해서 트랜잭션을 닫아야 합니다.
  });

  // 5. 상품 정보 로드 상태 감시 및 구매 확인
  store.when().productUpdated(product => {
    if (product.id === PRODUCT_2X_BOOST || product.id === PRODUCT_2X_BOOST_ALT) {
      console.log(`상품 상태 업데이트: ${product.id} [Valid: ${product.valid}, Owned: ${product.owned}]`);
      if (product.owned && !game.is_2x_boost_owned) {
        game.is_2x_boost_owned = true;
        saveGame();
        showAlert("영구 2배 부스트 구매가 완료(또는 복원)되었습니다!");
      }
    }
  });

  // 6. 에러 처리
  store.error(err => {
    console.error("Store Error:", err);
  });

  // 7. 초기화 실행
  store.initialize([
    Platform.GOOGLE_PLAY,
    Platform.APPLE_APPSTORE
  ]).then(() => {
    console.log("Store initialized successfully");
  }).catch(err => {
    console.error("Store initialization failed", err);
  });
}

const buyPermanentBoost = () => {
  if (!window.CdvPurchase) {
    showAlert("스토어를 사용할 수 없는 환경입니다.");
    return;
  }

  const { store } = window.CdvPurchase;
  if (!store) {
    showAlert("스토어가 초기화되지 않았습니다.");
    return;
  }

  try {
    const p1 = store.get(PRODUCT_2X_BOOST);
    const p2 = store.get(PRODUCT_2X_BOOST_ALT);

    let product = (p1 && p1.canPurchase) ? p1 : (p2 && p2.canPurchase) ? p2 : (p1 || p2);

    if (!product) {
      showAlert("스토어 상품 정보를 찾을 수 없습니다. 다시 시도해 주세요.");
      store.update();
      return;
    }

    if (product.canPurchase) {
      const offer = product.getOffer ? product.getOffer() : null;
      if (offer) {
        store.order(offer);
      } else {
        store.order(product.id);
      }
    } else if (product.owned) {
      showAlert("이미 구매한 상품입니다.");
    } else {
      let msg = "현재 이 앱(기기)에서는 스토어가 상품을 내려주지 않고 있습니다.\n\n";
      if (p1) msg += `[${p1.id}] state: ${p1.state}\n`;
      if (p2) msg += `[${p2.id}] state: ${p2.state}\n`;
      msg += "\n(state가 invalid나 registered면 스토어 서버 측 거부 상태입니다. 테스트 트랙에서 다시 다운로드 해보세요.)";
      showAlert(msg);
      store.update();
    }
  } catch (err) {
    console.error("IAP purchase error:", err);
    showAlert("구매 처리 중 오류가 발생했습니다: " + (err.message || String(err)));
  }
}

onMounted(() => {
  loadGame();
  makefx();

  const startStore = () => {
    console.log("Starting IAP Store...");
    initStore();
  };

  if (window.cordova || window.Capacitor) {
    if (window.cordova) {
      document.addEventListener('deviceready', startStore, false);
    } else {
      // Capacitor 환경에서는 바로 실행 (또는 플러그인 로드 후)
      startStore();
    }
  } else {
    console.log("Not in a Cordova/Capacitor environment.");
  }

  setInterval(manualTick, 100);
  setInterval(saveGame, 30000);
})
</script>

<style scoped>
@import url('https://webfontworld.github.io/gmarket/GmarketSans.css');
/* 전역 스크롤 방지 및 높이 고정 (Capacitor 대응) */
:deep(html), :deep(body) {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: fixed;
  width: 100%;
}

#app, .app-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  background-color: #050505;
  /* 화면 전체 고정 */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.container {
  width: 100%;
  max-width: 450px;
  background-color: #0f0f11;
  display: flex;
  flex-direction: column;
  /* 시스템 바 가려짐 방지: 최소 상단 44px, 하단 34px 여백 강제 확보 */
  padding-top: max(44px, env(safe-area-inset-top, 44px));
  padding-bottom: max(34px, env(safe-area-inset-bottom, 34px));
  padding-left: 16px;
  padding-right: 16px;
  gap: 20px;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
@media (min-width: 451px) { .container { border-left: 1px solid #2a2a2e; border-right: 1px solid #2a2a2e; } }
.header-card { background: linear-gradient(145deg, #1a1a1e, #141417); padding: 24px; border-radius: 20px; border: 1px solid #2a2a2e; text-align: center; }
.resource-display { font-size: 2.8rem; color: #fff; margin: 10px 0; }
.tab-menu { display: flex; background: #1a1a1e; padding: 8px; border-radius: 15px; gap: 5px; }
.tab-menu button { flex: 1; border: none; background: transparent; padding: 10px 0; border-radius: 10px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.tab-menu button.active { background: #2a2a2e; }
.tab-label { font-size: 0.65rem; color: #888; }
.upgrade-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.upg-card-mini { background: #16161a; border: 1px solid #2a2a2e; border-radius: 12px; padding: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s; font-family: inherit; }
.upg-card-mini.can-buy:hover { border-color: #5e81ac; transform: translateY(-3px); background: #1c1c22; }
.upg-card-mini.locked { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }
.upg-name { color: #fff; font-size: 0.9rem; font-weight: bold; }
.cost-val { color: #ebcb8b; font-weight: bold; font-size: 0.95rem; }
.cost-unit { color: #666; font-size: 0.7rem; margin-left: 2px; }
.upg-level { font-size: 0.7rem; color: #5e81ac; }
.settings-group { display: flex; flex-direction: column; gap: 10px; }
.sub-btn { padding: 15px; border-radius: 10px; border: 1px solid #333; background: #1a1a1e; color: white; cursor: pointer; font-family: inherit; }
.sub-input { padding: 10px; border-radius: 8px; border: 1px solid #333; background: #121216; color: #e5e9f0; font-family: inherit; }
.sub-btn.danger { border-color: #bf616a; color: #bf616a; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.buy-max-btn { background: #2e3440; border: 1px solid #4c566a; color: #eceff4; padding: 4px 12px; border-radius: 8px; font-size: 0.7rem; cursor: pointer; }
.stats-container { background: #16161a; border: 1px solid #2a2a2e; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 15px; }
.stats-item { display: flex; justify-content: space-between; border-bottom: 1px solid #2a2a2e; padding-bottom: 8px; }
.stats-value { color: #fff; font-weight: bold; }
.exp-header-card { background: linear-gradient(145deg, #2e1a1e, #1a0f11); padding: 24px; border-radius: 20px; border: 1px solid #4e2a2e; text-align: center; margin-bottom: 20px; }
.exp-resource-display { font-size: 2.2rem; color: #ff79c6; margin: 10px 0; font-weight: bold; text-shadow: 0 0 10px rgba(255, 121, 198, 0.3); }
.exp-desc { font-size: 0.8rem; color: #a89984; }
.full-row { grid-column: 1 / -1; }
.upg-card-mini.research-unlocked { background: linear-gradient(145deg, #1a2e1a, #162016); border-color: #4a7c59; opacity: 1; cursor: default; }
.upg-card-mini.research-unlocked .upg-name { color: #a3be8c; }

.limit-reset-btn {
  background: linear-gradient(135deg, #bf616a, #d08770);
  color: white;
  font-size: 1.3rem;
  font-weight: bold;
  padding: 16px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(191, 97, 106, 0.4);
  transition: all 0.2s ease;
  animation: pulse-glow 2s infinite;
}
.limit-reset-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(191, 97, 106, 0.6);
}
.limit-upgrade-btn {
  background: #3b4252;
  color: #eceff4;
  font-size: 1rem;
  font-weight: bold;
  padding: 10px 16px;
  border: 1px solid #88c0d0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 10px;
}
.limit-upgrade-btn:not(:disabled):hover {
  background: #88c0d0;
  color: #2e3440;
}
.limit-upgrade-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #4c566a;
}
@keyframes pulse-glow {
  0% { box-shadow: 0 0 0 0 rgba(191, 97, 106, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(191, 97, 106, 0); }
  100% { box-shadow: 0 0 0 0 rgba(191, 97, 106, 0); }
}
</style>

