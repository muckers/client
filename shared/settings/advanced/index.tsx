import * as React from 'react'
import * as Kb from '../../common-adapters'
import * as Styles from '../../styles'
import {isMobile, isLinux, defaultUseNativeFrame} from '../../constants/platform'
import flags from '../../util/feature-flags'
// normally never do this but this call serves no purpose for users at all
import * as RPCChatTypes from '../../constants/types/rpc-chat-gen'
import * as RPCTypes from '../../constants/types/rpc-gen'
import AppState from '../../app/app-state'

type Props = {
  openAtLogin: boolean
  lockdownModeEnabled: boolean | null
  onChangeLockdownMode: (arg0: boolean) => void
  onSetOpenAtLogin: (open: boolean) => void
  onDBNuke: () => void
  onTrace: (durationSeconds: number) => void
  onProcessorProfile: (durationSeconds: number) => void
  onBack: () => void
  setLockdownModeError: string
  settingLockdownMode: boolean
  traceInProgress: boolean
  processorProfileInProgress: boolean
  hasRandomPW: boolean
  useNativeFrame: boolean
  onChangeUseNativeFrame: (arg0: boolean) => void
}

const stateUseNativeFrame = new AppState().state.useNativeFrame
const initialUseNativeFrame =
  stateUseNativeFrame !== null && stateUseNativeFrame !== undefined
    ? stateUseNativeFrame
    : defaultUseNativeFrame

const UseNativeFrame = (props: Props) => {
  return (
    !isMobile && (
      <>
        <Kb.Box style={styles.checkboxContainer}>
          <Kb.Checkbox
            checked={!props.useNativeFrame}
            label={'Hide system window frame'}
            onCheck={x => props.onChangeUseNativeFrame(!x)}
            style={styles.checkbox}
          />
        </Kb.Box>
        {initialUseNativeFrame !== props.useNativeFrame && (
          <Kb.Text type="BodySmall" style={styles.error}>
            Keybase needs to restart for this change to take effect.
          </Kb.Text>
        )}
      </>
    )
  )
}

const Advanced = (props: Props) => {
  const disabled = props.lockdownModeEnabled == null || props.hasRandomPW || props.settingLockdownMode
  return (
    <Kb.Box style={styles.advancedContainer}>
      <Kb.Box style={styles.progressContainer}>
        {props.settingLockdownMode && <Kb.ProgressIndicator />}
      </Kb.Box>
      <Kb.Box style={styles.checkboxContainer}>
        <Kb.Checkbox
          checked={props.hasRandomPW || !!props.lockdownModeEnabled}
          disabled={disabled}
          label={
            'Forbid account changes from the website' +
            (props.hasRandomPW ? ' (you need to set a password first)' : '')
          }
          onCheck={props.onChangeLockdownMode}
          style={styles.checkbox}
        />
      </Kb.Box>
      {!!props.setLockdownModeError && (
        <Kb.Text type="BodySmall" style={styles.error}>
          {props.setLockdownModeError}
        </Kb.Text>
      )}
      {isLinux && <UseNativeFrame {...props} />}
      {!Styles.isMobile && !isLinux && (
        <Kb.Box style={styles.openAtLoginCheckboxContainer}>
          <Kb.Checkbox
            label="Open Keybase on startup"
            checked={props.openAtLogin}
            onCheck={props.onSetOpenAtLogin}
          />
        </Kb.Box>
      )}
      <ProxySettings {...props} />
      <Developer {...props} />
    </Kb.Box>
  )
}

type StartButtonProps = {
  label: string
  inProgress: boolean
  onStart: () => void
}

const StartButton = (props: StartButtonProps) => (
  <Kb.Button
    waiting={props.inProgress}
    style={{marginTop: Styles.globalMargins.small}}
    type="Danger"
    label={props.label}
    onClick={props.onStart}
  />
)

type State = {
  cleanTook: number
  clickCount: number
  indexTook: number
}

const clickThreshold = 7
const traceDurationSeconds = 30
const processorProfileDurationSeconds = 30

class Developer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      cleanTook: -1,
      clickCount: 0,
      indexTook: -1,
    }
  }

  _onLabelClick = () => {
    this.setState(state => {
      const clickCount = state.clickCount + 1
      if (clickCount < clickThreshold) {
        console.log(
          `clickCount = ${clickCount} (${clickThreshold - clickCount} away from showing developer controls)`
        )
      }
      return {clickCount}
    })
  }

  _showPprofControls = () => {
    return this.state.clickCount >= clickThreshold
  }

  render() {
    const props = this.props
    return (
      <Kb.Box style={styles.developerContainer}>
        <Kb.Text center={true} type="BodySmallSemibold" onClick={this._onLabelClick} style={styles.text}>
          Please don't do anything below here unless instructed to by a developer.
        </Kb.Text>
        <Kb.Divider style={styles.divider} />
        <Kb.Button
          style={{marginTop: Styles.globalMargins.small}}
          type="Danger"
          label="DB Nuke"
          onClick={props.onDBNuke}
        />
        {this._showPprofControls() && (
          <React.Fragment>
            <StartButton
              label={`Trace (${traceDurationSeconds}s)`}
              onStart={() => props.onTrace(traceDurationSeconds)}
              inProgress={props.traceInProgress}
            />
            <StartButton
              label={`CPU Profile (${traceDurationSeconds}s)`}
              onStart={() => props.onProcessorProfile(processorProfileDurationSeconds)}
              inProgress={props.processorProfileInProgress}
            />
            <Kb.Text center={true} type="BodySmallSemibold" style={styles.text}>
              Trace and profile files are included in logs sent with feedback.
            </Kb.Text>
          </React.Fragment>
        )}
        {flags.chatIndexProfilingEnabled && (
          <Kb.Button
            label={`Chat Index: ${this.state.indexTook}ms`}
            onClick={() => {
              this.setState({indexTook: -1})
              const start = Date.now()
              RPCChatTypes.localProfileChatSearchRpcPromise({
                identifyBehavior: RPCTypes.TLFIdentifyBehavior.chatGui,
              }).then(() => this.setState({indexTook: Date.now() - start}))
            }}
          />
        )}
        {flags.dbCleanEnabled && (
          <Kb.Button
            label={`DB clean: ${this.state.cleanTook}ms`}
            onClick={() => {
              this.setState({cleanTook: -1})
              const start = Date.now()
              RPCTypes.ctlDbCleanRpcPromise({
                dbType: RPCTypes.DbType.main, // core db
                force: true,
              }).then(() => this.setState({cleanTook: Date.now() - start}))
            }}
          />
        )}
        <Kb.Box style={styles.filler} />
      </Kb.Box>
    )
  }
}

enum ProxyType {
  Socks5 = "Socks5",
  HTTP_Connect = "HTTP_Connect",
  No_Proxy = "No_Proxy",
}

type ProxyState = {
  address: string
  port: string
  proxyType: ProxyType
  edited: boolean
}

class ProxySettings extends React.Component<Props, ProxyState> {
  constructor(props: Props) {
    super(props)

    this.state = {
      address: "",
      port: "",
      proxyType: ProxyType.No_Proxy,
      edited: false,
    }
  }

  handleAddressChange(address: string) {
    var edited = (address !== this.state.address) || this.state.edited
    this.setState({address, edited})
  }

  handlePortChange(port: string) {
    var edited = (port !== this.state.port) || this.state.edited
    this.setState({port, edited})
  }

  setProxyType(proxyType: string) {
    this.setState({proxyType: ProxyType[proxyType]})
    alert(JSON.stringify(this.state))
    alert(proxyType)
    alert(JSON.stringify(ProxyType))
  }

  saveProxySettings() {
    // TODO
  }

  render() {
    return (
      <Kb.Box style={styles.proxyContainer}>
        <Kb.Divider style={styles.divider} />
        <Kb.Text center={true} type="BodySmallSemibold" style={styles.text}>
          Configure a HTTP(s) or SOCKS5 proxy
        </Kb.Text>
        <Kb.Box>
          {
            Object.keys(ProxyType).map(proxyType => 
              <Kb.Button 
                style={{margin: Styles.globalMargins.tiny}} 
                onClick={() => this.setProxyType(proxyType)}
                color={this.state.proxyType == proxyType ? 'Default' : 'Dim'}
                >
                {proxyType}
              </Kb.Button>
            )
          }
        </Kb.Box>
        <Kb.Box>
          <Kb.Input
            hintText="Proxy Address"
            value={this.state.address}
            onChangeText={addr => this.handleAddressChange(addr)}
            style={{width: 400}}
          />
          <Kb.Input
            hintText="Proxy Port"
            value={this.state.port}
            onChangeText={port => this.handlePortChange(port)}
            style={{width: 200}}
          />
        </Kb.Box>
        <Kb.Button 
          style={{margin: Styles.globalMargins.xsmall}} 
          onClick={this.saveProxySettings()}>  
          Save Proxy Settings
        </Kb.Button>

      </Kb.Box>
    );
  }
}

const styles = Styles.styleSheetCreate({
  advancedContainer: {
    ...Styles.globalStyles.flexBoxColumn,
    flex: 1,
    paddingBottom: Styles.globalMargins.medium,
    paddingLeft: Styles.globalMargins.medium,
    paddingRight: Styles.globalMargins.medium,
  },
  checkbox: {
    flex: 1,
    paddingBottom: Styles.globalMargins.small,
    paddingTop: Styles.globalMargins.small,
  },
  checkboxContainer: {
    ...Styles.globalStyles.flexBoxRow,
    alignItems: 'center',
    minHeight: 48,
  },
  developerContainer: {
    ...Styles.globalStyles.flexBoxColumn,
    alignItems: 'center',
    flex: 1,
    paddingBottom: Styles.globalMargins.medium,
    paddingTop: Styles.globalMargins.xlarge,
  },
  proxyContainer: {
    ...Styles.globalStyles.flexBoxColumn,
    alignItems: 'center',
    flex: 1,
    paddingBottom: Styles.globalMargins.medium,
    paddingTop: Styles.globalMargins.large,
  },
  divider: {
    marginTop: Styles.globalMargins.xsmall,
    width: '100%',
  },
  error: {
    color: Styles.globalColors.red,
  },
  filler: {
    flex: 1,
  },
  openAtLoginCheckboxContainer: {
    ...Styles.globalStyles.flexBoxColumn,
    alignItems: 'flex-start',
    flex: 1,
  },
  progressContainer: {
    ...Styles.globalStyles.flexBoxRow,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  text: Styles.platformStyles({
    isElectron: {
      cursor: 'default',
    },
  }),
})

export default Advanced
