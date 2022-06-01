import { NextPage } from "next"
import { useWalletContext } from "../context/wallet.context"
import { Counter__factory, Counter as CounterContract } from "../types/typechain/"
import { useEffect, useState } from "react"
import Layout from "../components/layout"
import { Button, Text, Group, Title, Box } from "@mantine/core"
import { notify, genericErrorNotify, genericTransactionNotify } from "../utils/notify"
import { ArrowUpCircle, ArrowDownCircle, Refresh } from "tabler-icons-react"
import { BigNumber, ethers } from "ethers"
import getContractAddress from "../constants/contractAddresses"
import contractConstants from "../constants/contractConstants"
import { truncateAddress } from "../utils/utility"

const CounterContractPage: NextPage = () => {
  const { wallet } = useWalletContext()
  const [contract, setContract] = useState<CounterContract>()
  // contract view states
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (wallet) {
      try {
        const contractAddress = getContractAddress(contractConstants.Counter.contractName, wallet.chainId)
        notify("Contract Connected", "Connected to " + truncateAddress(contractAddress), "success")
        setContract(Counter__factory.connect(contractAddress, wallet.library.getSigner(wallet.address)))
      } catch (e: any) {
        genericErrorNotify(e, "Contract Not Found", false)
      }
    }

    return () => {
      setContract(undefined)
    }
  }, [wallet])

  // on contract load
  useEffect(() => {
    if (contract == undefined) return

    // get current count
    contract.getCount().then(
      (count) => setCount(count.toNumber()),
      (e) => genericErrorNotify(e, "getCount")
    )

    // subscribe to events
    contract.on(contract.filters.CountedTo(), listenCountedTo)

    return () => {
      // unsubscribe from events
      contract.off(contract.filters.CountedTo(), listenCountedTo)
    }
  }, [contract])

  // event listener for CountedTo
  const listenCountedTo: ethers.providers.Listener = (newCount: BigNumber) => {
    notify("Event Listened", "CountedTo event returned " + newCount.toNumber(), "info")
    setCount(newCount.toNumber())
  }

  // refresh the count (alternative to events)
  const handleRefresh = async () => {
    if (contract) {
      try {
        const count = await contract.getCount()
        setCount(count.toNumber())
      } catch (e: any) {
        genericErrorNotify(e)
      }
    }
  }

  // increment counter
  const handleCountUp = async () => {
    if (contract) {
      try {
        const tx = await contract.countUp()
        genericTransactionNotify(tx)
        await tx.wait()
        notify("Transaction", "Counted up!", "success")
      } catch (e: any) {
        genericErrorNotify(e)
      }
    }
  }

  // decrement counter
  const handleCountDown = async () => {
    if (contract) {
      try {
        const tx = await contract.countDown()
        genericTransactionNotify(tx)
        await tx.wait()
        notify("Transaction", "Counted down!", "success")
      } catch (e: any) {
        genericErrorNotify(e)
      }
    }
  }

  return (
    <Layout>
      {contract ? (
        <>
          <Box my="xl" mx="auto" sx={{ textAlign: "center", width: "70%" }}>
            <Title>A Simple Counter Contract</Title>
            <Text>
              The contract simply stores one 256-bit unsigned integer in it. You can increment and decrement this
              counter, each of which is a transaction. If the count goes below 0, the transaction is rejected. The
              counting event is subscribed automatically, but there is also a refresh button as an example.
            </Text>
          </Box>
          <Box my="xl">
            <Text size="xl" sx={{ textAlign: "center" }}>
              <b>Count:</b> {count}
            </Text>
          </Box>

          <Group my="xl" position="center">
            <Button onClick={handleCountUp} color="secondary">
              <ArrowUpCircle />
            </Button>
            <Button onClick={handleCountDown} color="secondary">
              <ArrowDownCircle />
            </Button>
            <Button onClick={handleRefresh}>
              <Refresh />
            </Button>
          </Group>
        </>
      ) : (
        <Title p="xl">Please connect your wallet first.</Title>
      )}
    </Layout>
  )
}

export default CounterContractPage
