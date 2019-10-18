import * as React from 'react'
import PeopleItem from '../item'
import * as Types from '../../constants/types/people'
import * as Kb from '../../common-adapters'
import * as Styles from '../../styles'
import * as Container from '../../util/container'
import * as Tracker2Constants from '../../constants/tracker2'
import * as Tracker2Gen from '../../actions/tracker2-gen'
import * as Chat2Gen from '../../actions/chat2-gen'
import HiddenString from '../../util/hidden-string'

const connectedUsernamesProps = {
  colorFollowing: true,
  inline: true,
  joinerStyle: {
    fontWeight: 'normal',
  },
  onUsernameClicked: 'profile',
  type: 'BodySemibold',
  underline: true,
} as const

export type NewFollow = Types.FollowedNotification

export type Props = Types._FollowedNotificationItem & {
  onClickUser: (username: string) => void
}

export default (props: Props) => {
  if (props.newFollows.length === 1) {
    return <FollowNotification {...props} />
  }
  return <MultiFollowNotification {...props} />
}

const FollowNotification = (props: Props) => {
  if (props.newFollows.length !== 1) {
    throw new Error('Single follow notification must have exactly one user supplied')
  }
  const username = props.newFollows[0].username
  const usernameComponent = (
    <Kb.ConnectedUsernames
      {...connectedUsernamesProps}
      usernames={[username]}
      onUsernameClicked={props.onClickUser}
    />
  )
  const desc = props.newFollows[0].contactDescription

  const dispatch = Container.useDispatch()
  const userDetails = Container.useSelector(state => Tracker2Constants.getDetails(state, username))
  const onFollow = () => dispatch(Tracker2Gen.createChangeFollow({follow: true, guiID: userDetails.guiID}))
  const onWave = () =>
    dispatch(Chat2Gen.createMessageSendByUsername({text: new HiddenString(':wave:'), username}))
  const onClickBox = props.type === 'follow' ? () => props.onClickUser(username) : undefined
  return (
    <Kb.ClickableBox onClick={onClickBox}>
      <PeopleItem
        badged={props.badged}
        buttons={
          props.type == 'contact'
            ? [
                {label: 'Follow', onClick: onFollow, type: 'Success' as const},
                {
                  label: 'Wave ',
                  labelIcon: <Kb.Emoji emojiName=":wave:" size={16} />,
                  mode: 'Secondary' as const,
                  onClick: onWave,
                },
              ]
            : undefined
        }
        icon={
          <Kb.Avatar
            username={username}
            onClick={() => props.onClickUser(username)}
            size={Styles.isMobile ? 48 : 32}
          />
        }
        iconContainerStyle={styles.iconContainer}
        when={props.notificationTime}
        contentStyle={styles.peopleItem}
        format="single"
      >
        {props.type === 'follow' ? (
          <Kb.Text type="Body">{usernameComponent} followed you.</Kb.Text>
        ) : (
          <Kb.Text type="Body">
            Your contact {desc} joined Keybase as {usernameComponent}.
          </Kb.Text>
        )}
      </PeopleItem>
    </Kb.ClickableBox>
  )
}

export const MultiFollowNotification = (props: Props) => {
  if (props.newFollows.length <= 1) {
    throw new Error('Multi follow notification must have more than one user supplied')
  }
  const usernames = props.newFollows.map(f => f.username)
  const usernamesComponent = (
    <>
      <Kb.ConnectedUsernames
        containerStyle={styles.usernames}
        inlineGrammar={true}
        showAnd={!props.numAdditional}
        {...connectedUsernamesProps}
        usernames={usernames}
        onUsernameClicked={props.onClickUser}
      />
      {!!props.numAdditional && props.numAdditional > 0 && ` and ${props.numAdditional} others`}
    </>
  )
  return (
    <PeopleItem format="multi" badged={props.badged} when={props.notificationTime}>
      {props.type === 'follow' ? (
        <Kb.Text type="Body" style={styles.multiText}>
          {usernamesComponent} started following you.
        </Kb.Text>
      ) : (
        <Kb.Text type="Body" style={styles.multiText}>
          Your contacts {usernamesComponent} joined Keybase.
        </Kb.Text>
      )}
      <Kb.ScrollView
        {...(Styles.isMobile ? {alwaysBounceHorizontal: false, horizontal: true} : {})} // Causes error on desktop
        contentContainerStyle={styles.scrollViewContainer}
      >
        {usernames.map(username => (
          <Kb.WithTooltip key={username} tooltip={username}>
            <Kb.Avatar
              onClick={() => props.onClickUser(username)}
              username={username}
              size={32}
              style={styles.avatar}
            />
          </Kb.WithTooltip>
        ))}
      </Kb.ScrollView>
    </PeopleItem>
  )
}

const styles = Styles.styleSheetCreate(
  () =>
    ({
      avatar: {marginRight: Styles.globalMargins.xtiny},
      iconContainer: {width: 'auto'},
      multiText: Styles.platformStyles({
        common: {
          marginLeft: Styles.globalMargins.small,
          marginRight: Styles.globalMargins.xlarge,
          marginTop: 2,
        },
        isElectron: {display: 'inline'},
      }),
      peopleItem: {justifyContent: 'center'},
      scrollViewContainer: Styles.platformStyles({
        common: {
          ...Styles.globalStyles.flexBoxRow,
          paddingBottom: Styles.globalMargins.tiny,
          paddingLeft: Styles.globalMargins.small,
          paddingRight: Styles.globalMargins.small,
        },
        isMobile: {
          ...Styles.globalStyles.flexBoxRow,
          flexWrap: 'wrap',
          height: 32,
          overflow: 'hidden',
          width: '100%',
        },
      }),
      usernames: Styles.platformStyles({isElectron: {whiteSpace: 'normal'} as const}),
    } as const)
)
