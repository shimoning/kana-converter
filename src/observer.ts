import { kanaConverter, KanaType } from './utilities/kanaConverter'

export { kanaConverter, KanaType }

export type Options = {
  observeInterval?: number; // unit: ms
  debug?: boolean; // logging if true
  realtime?: boolean | HTMLInputElement;
  enter?: boolean | HTMLInputElement;
  clearOnInputEmpty?: boolean;
};
export type Output = {
  element: HTMLInputElement;
  type?: KanaType;
};
export enum OutputMode {
  REALTIME, // default and priority
  ENTER,
}

// eslint-disable-next-line no-irregular-whitespace
export const AntiHiraganaPattern = /[^ 　ぁあ-んー]/g
export const CompactHiraganaPattern = /[ぁぃぅぇぉっゃゅょ]/g

export function setupObserver(
  input: HTMLInputElement,
  outputs: Output[] | string | string[],
  options: Options = {
    observeInterval: 30,
    debug: false,
    realtime: true,
    enter: false,
    clearOnInputEmpty: false,
  },
) {
  let outputMode = OutputMode.REALTIME
  function _checkOutputMode() {
    const realtime =
      options.realtime &&
      (options.realtime === true ||
        (options.realtime instanceof HTMLInputElement && options.realtime.checked))
    const enter =
      options.enter &&
      (options.enter === true ||
        (options.enter instanceof HTMLInputElement && options.enter.checked))
    outputMode = realtime || !enter
      ? OutputMode.REALTIME // realtime=true, realtime=false & enter=false
      : OutputMode.ENTER  // realtime=false & enter=true
  }

  // 出力先を整える
  const activeOutputs: Required<Output>[] = []
  if (typeof outputs === 'string') {
    const elements = document.querySelectorAll<HTMLInputElement>(outputs)
    for (const element of elements) {
      activeOutputs.push({ element, type: KanaType.Hiragana })
    }
  } else {
    for (const output of outputs) {
      if (typeof output === 'string') {
        const elements = document.querySelectorAll<HTMLInputElement>(output)
        for (const element of elements) {
          activeOutputs.push({ element, type: KanaType.Hiragana })
        }
      } else {
        activeOutputs.push({
          element: output.element,
          type: output.type ?? KanaType.Hiragana,
        })
      }
    }
  }

  let compositing: boolean = false
  let defaultString: string = ''
  let currentString: string = ''

  let inputValue: string = ''
  const outputValues: string[] = new Array(activeOutputs.length).fill('')
  /**
   * 初期化
   * @returns void
   */
  function _reset() {
    _debug('reset')
    defaultString = ''
    currentString = ''

    inputValue = ''
    for (let i = 0; i < activeOutputs.length; i++) {
      outputValues[i] = ''
    }
  }
  /**
   * 初期入力値を保存する
   * @returns void
   */
  function _setup() {
    defaultString = input.value
    activeOutputs.forEach(({ element }, index) => {
      outputValues[index] = element.value
    })
    _debug('setup', input.value, { defaultString, activeOutputs })
  }

  let timer: number | undefined
  /**
   * 監視を開始する
   * @returns void
   */
  function _start() {
    _debug('start', { timer })
    if (timer) {
      return
    }
    timer = setInterval(() => {
      _checkOutputMode()
      _observe()
    }, options.observeInterval ?? 30)
  }
  /**
   * 監視を終了する
   * @returns void
   */
  function _end() {
    _debug('end')
    if (timer) {
      clearInterval(timer)
      timer = undefined
    }
  }

  /**
   * 入力を監視する
   * @return void
   */
  function _observe() {
    let inputString = input.value
    _debug('observe', { compositing, inputString, defaultString, currentString, outputValues })

    // 空文字の場合は何もしない
    if (inputString === '') {
      return
    }

    // すでに入力されている文字を取り除く
    if (inputString.indexOf(defaultString) !== -1) {
      inputString = inputString.replace(defaultString, '')
    }

    // 同じだったら何もしない
    if (currentString === inputString) {
      return
    }
    currentString = inputString

    // 変換完了している場合は何もしない
    if (!compositing) {
      return
    }

    // ひらがなを抽出して確認及び設定
    const hiraganaString = currentString.replace(AntiHiraganaPattern, '')
    _set(hiraganaString)
  }

  /**
   * 保存する
   * @param hiraganaString
   */
  function _set(hiraganaString: string) {
    _debug('set', { defaultString, hiraganaString, inputValue, outputValues })
    if (hiraganaString.length) {
      inputValue = hiraganaString
    }

    activeOutputs.forEach(({ element, type }, index) => {
      const converted = kanaConverter(type, inputValue)
      _debug('converted', { type, inputValue, after: converted, before: outputValues[index] })
      if (outputMode === OutputMode.REALTIME) {
        element.value = outputValues[index] + converted
      } else if (outputMode === OutputMode.ENTER) {
        element.dataset['kana'] = outputValues[index] = converted
      }
    })
  }

  function _reflect() {
    activeOutputs.forEach(({ element }) => {
      if (element.dataset['kana']) {
        element.value += element.dataset['kana']
        element.removeAttribute('data-kana')
      }
    })
  }

  /**
   * デバッグログ
   * @param message
   * @param args
   * @return void
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function _debug(message: string, ...args: any[]) {
    if (!options.debug) {
      return
    }
    if (args.length === 0) {
      console.info('debug', { message })
      return
    }
    console.info('debug', { message }, ...args)
  }

  /**
   * event listeners
   */
  input.addEventListener('focus', () => {
    _debug('focus')
    _setup()
  })
  input.addEventListener('blur', () => {
    _debug('blur')
    _end()
  })
  input.addEventListener('compositionstart', (e: CompositionEvent) => {
    _debug('compositionstart', { e })
    _setup()
    _start()
    compositing = true
  })
  input.addEventListener('compositionend', (e: CompositionEvent) => {
    _debug('compositionend', { e })
    _end()
    compositing = false
  })
  input.addEventListener('keydown', (e: KeyboardEvent) => {
    _debug('keydown', { compositing, e })
    if (!compositing) {
      _setup()
    }

    if (e.code === 'Enter') {
      if (options.clearOnInputEmpty && input.value === '') {
        _reset()
        _set('')
      } else {
        if (outputMode === OutputMode.ENTER) {
          _reflect()
        }
      }
    }
  })
  input.addEventListener('keyup', (e: Event) => {
    _debug('keyup', { compositing, e })
  })
}
