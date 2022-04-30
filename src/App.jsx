import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor'
import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import idl from './idl.json';
import kp from './keypair.json'
import { Buffer } from 'buffer'
window.Buffer = Buffer

const { SystemProgram, Keypair } = web3

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

const programID = new PublicKey(idl.metadata.address)
const network = clusterApiUrl('devnet')
const opts = {
  preflightCommitment: 'processed'
}

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TEST_GIFS = [
  'https://media.giphy.com/media/dVuaiKbihwlS8/giphy.gif',
  'https://media.giphy.com/media/l0IylOPCNkiqOgMyA/giphy.gif',
  'https://media.giphy.com/media/d3QGYTziFiDL2/giphy.gif'
]

/* 
  TODO:
  Show the public address of the user who posted each GIF
  Allow users to upvote GIFs
  Allow users to "tip" GIF posters with SOL
*/

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null)
  const [inputValue, setInputValue] = useState("")
  const [gifList, setGifList] = useState([])

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window
      if(solana) {
        if(solana.isPhantom) {
          console.log('wallet connected lets goooo')

          const response = await solana.connect({onlyIfTrusted: true})
          console.log('connected with public key', response.publicKey.toString())
          setWalletAddress(response.publicKey.toString())
        }
      } else {
        console.log('wallet not found ya turkey')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const connectWallet = async () => {
    const { solana } = window

    if(solana) {
      const response = await solana.connect()
      console.log('connected with public key', response.publicKey.toString())
      setWalletAddress(response.publicKey.toString())
    }
  }

  const sendGif = async () => {
    if(inputValue.length > 0) {
      console.log("GIF Link:", inputValue)

      try {
        const provider = getProvider()
        const program = new Program(idl, programID, provider)

        await program.rpc.addGif(inputValue, {
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey
          }
        })
        console.log('gif successfully sent to program', inputValue)
        await getGifList()

        setInputValue("")
      } catch (error) {
        console.error('failed to send gif', error)
      }
    } else {
      console.log('enter text stupid!')
    }
  }

  const renderNotConnectedContainer = () => (
    <button className="cta-button connect-wallet-button" onClick={connectWallet}>
      Connect Wallet
    </button>
  )

  const onInputChange = event => {
    const { value } = event.target

    setInputValue(value)
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment)
    const provider = new Provider(connection, window.solana, opts.preflightCommitment)

    return provider
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [baseAccount]
      })

      console.log('Created a new base account', baseAccount.publicKey.toString())
      await getGifList()
    } catch (error) {
      console.error('error creating base account', error)
    }
  }

  const renderConnectedContainer = () => {
    if(gifList === null) {
      return <div className="connected-container">
        <button 
          className="cta-button submit-gif-button"
          onClick={createGifAccount}
        >
          Do One-Time Initialization for Get Program accounts
        </button>
      </div>
    } else {
      return (
        <div className="connected-container">
          <form
            onSubmit={e => {
              e.preventDefault()
              sendGif()
            }}  
          >
            <input type="text" placeholder="Enter gif link" value={inputValue} onChange={onInputChange}/>
            <button type="submit" className="cta-button submit-gif-button">
              Submit
            </button>
          </form>
          <div className="gif-grid">
            { gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} alt={item.gifLink} />
              </div>
            ))}
          </div>
        </div>
      )
    }
}

  const getGifList = async () => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey)

      console.log('got the account', account)

      setGifList(account.gifList)
    } catch (error) {
      console.error('error fetching gif list', error)
      setGifList(null)
    }
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected()
    }

    window.addEventListener('load', onLoad)

    return () => window.removeEventListener('load', onLoad)
  }, [])

  useEffect(()=> {
    if(walletAddress) {
      console.log('fetching gif list...')

      getGifList()
    }
  }, [walletAddress])
  
  return (
    <div className="App">
      <div className={walletAddress ? "authed-container" : "container"}>
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>

          { !walletAddress && renderNotConnectedContainer() }

          { walletAddress && renderConnectedContainer() }
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`Adapted from @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
