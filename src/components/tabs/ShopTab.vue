<template>
<!-- 5. Shop 탭 -->
          <div class="tab-pane">
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
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { game, saveGame } from '@/game'

const emit = defineEmits(['alert'])
const PRODUCT_2X_BOOST = 'fv_permanent_x2'
const PRODUCT_2X_BOOST_ALT = 'fv-permanent-x2'
let storeDeviceReadyHandler = null

const showAlert = (message, title = '알림') => emit('alert', message, title)

const initStore = () => {
  const CdvPurchase = window.CdvPurchase
  if (!CdvPurchase) {
    console.warn('CdvPurchase is not defined.')
    return
  }

  const { store, ProductType, Platform, LogLevel } = CdvPurchase
  store.verbosity = LogLevel.DEBUG

  store.register([
    { id: PRODUCT_2X_BOOST, type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY },
    { id: PRODUCT_2X_BOOST, type: ProductType.NON_CONSUMABLE, platform: Platform.APPLE_APPSTORE },
    { id: PRODUCT_2X_BOOST_ALT, type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY },
    { id: PRODUCT_2X_BOOST_ALT, type: ProductType.NON_CONSUMABLE, platform: Platform.APPLE_APPSTORE }
  ])

  store.when().approved(transaction => {
    console.log('Transaction approved:', transaction)
    transaction.verify()
  })

  store.when().verified(receipt => {
    console.log('Transaction verified:', receipt)
    receipt.finish()
  })

  store.when().productUpdated(product => {
    if (product.id === PRODUCT_2X_BOOST || product.id === PRODUCT_2X_BOOST_ALT) {
      console.log(`상품 상태 업데이트: ${product.id} [Valid: ${product.valid}, Owned: ${product.owned}]`)
      if (product.owned && !game.is_2x_boost_owned) {
        game.is_2x_boost_owned = true
        saveGame()
        showAlert('영구 2배 부스트 구매가 완료(또는 복원)되었습니다!')
      }
    }
  })

  store.error(err => {
    console.error('Store Error:', err)
  })

  store.initialize([Platform.GOOGLE_PLAY, Platform.APPLE_APPSTORE])
    .then(() => console.log('Store initialized successfully'))
    .catch(err => console.error('Store initialization failed', err))
}

const buyPermanentBoost = () => {
  if (!window.CdvPurchase) {
    showAlert('스토어를 사용할 수 없는 환경입니다.')
    return
  }

  const { store } = window.CdvPurchase
  if (!store) {
    showAlert('스토어가 초기화되지 않았습니다.')
    return
  }

  try {
    const p1 = store.get(PRODUCT_2X_BOOST)
    const p2 = store.get(PRODUCT_2X_BOOST_ALT)
    const product = (p1 && p1.canPurchase) ? p1 : (p2 && p2.canPurchase) ? p2 : (p1 || p2)

    if (!product) {
      showAlert('스토어 상품 정보를 찾을 수 없습니다. 다시 시도해 주세요.')
      store.update()
      return
    }

    if (product.canPurchase) {
      const offer = product.getOffer ? product.getOffer() : null
      store.order(offer || product.id)
    } else if (product.owned) {
      showAlert('이미 구매한 상품입니다.')
    } else {
      let msg = '현재 이 앱(기기)에서는 스토어가 상품을 내려주지 않고 있습니다.\n\n'
      if (p1) msg += `[${p1.id}] state: ${p1.state}\n`
      if (p2) msg += `[${p2.id}] state: ${p2.state}\n`
      msg += '\n(state가 invalid나 registered면 스토어 서버 측 거부 상태입니다. 테스트 트랙에서 다시 다운로드 해보세요.)'
      showAlert(msg)
      store.update()
    }
  } catch (err) {
    console.error('IAP purchase error:', err)
    showAlert('구매 처리 중 오류가 발생했습니다: ' + (err.message || String(err)))
  }
}

onMounted(() => {
  const startStore = () => {
    console.log('Starting IAP Store...')
    initStore()
  }

  if (window.cordova || window.Capacitor) {
    if (window.cordova) {
      storeDeviceReadyHandler = startStore
      document.addEventListener('deviceready', storeDeviceReadyHandler, false)
    } else {
      startStore()
    }
  } else {
    console.log('Not in a Cordova/Capacitor environment.')
  }
})

onUnmounted(() => {
  if (storeDeviceReadyHandler) {
    document.removeEventListener('deviceready', storeDeviceReadyHandler, false)
    storeDeviceReadyHandler = null
  }
})
</script>
