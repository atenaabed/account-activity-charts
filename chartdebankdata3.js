//const axios = require('axios');

async function dataChart(){
    try {
        const apiUrl = 'https://pro-openapi.debank.com/v1/user/history_list';
        const userId = '0x90caa215693b2E5C83bf16898384270fDBB8eD9E';
        const chainId = 'eth';
        const headers = {
          'accept': 'application/json',
          'AccessKey': '11637308d42222f1c8bc1cd76c1f9f9208913115',
        };
    
        const response = await axios.get(apiUrl, {
          params: {
            id: userId,
            chain_id: chainId,
          },
          headers: headers,
        });
    
        const historyList = response.data.history_list;
        const tokenDict = response.data.token_dict;
    
        const responseData = {};

        historyList.forEach(transaction => {
          const receives = transaction.receives || [];
          const sends = transaction.sends || [];
          const txInfo = transaction.tx || {};
    
          let transactionName = '';
    
          if (receives.length === 0 && sends.length === 0) {
            transactionName = transaction.cate_id;
          } else if (receives.length > 0 && sends.length === 0) {
            transactionName = 'receive transaction';
          } else if (sends.length > 0 && receives.length === 0) {
            transactionName = 'send transaction';
          } else {
            transactionName = 'swap transaction';
          }
    
          const getSendsData = sends.map(send => {
            const tokenInfo = tokenDict[send.token_id] || {};
            const sendAmountUSD = send.amount * (tokenInfo.price || 0);
            return { label: sendAmountUSD.toFixed(2), value: sendAmountUSD };
          });
    
          const getReceivesData = receives.map(receive => {
            const tokenInfo = tokenDict[receive.token_id] || {};
            const receiveAmountUSD = receive.amount * (tokenInfo.price || 0);
            return { label: receiveAmountUSD.toFixed(2), value: receiveAmountUSD };
          });
    
          const txName = txInfo.name ? `(${txInfo.name})` : '';
    
          const row = {
            sends: getSendsData,
            receives: getReceivesData,
            usd_gas_fee: txInfo.usd_gas_fee || '',
            eth_gas_fee: txInfo.eth_gas_fee || '',
            is_scam: transaction.is_scam.toString(),
            project_id: transaction.project_id || '',
            time_at: transaction.time_at || '',
            formatted_time: new Date(transaction.time_at * 1000).toLocaleString(),
          };
    
          // Analyze transactions
          if (!responseData[`${transactionName}(${txName})`]) {
            responseData[`${transactionName}(${txName})`] = {
              transactions: [],
              analysis: {
                total: 0,
                totalReceived: 0,
                totalSent: 0,
                totalAmountUSDReceived: 0,
                totalAmountUSDSent: 0,
                monthly: {},
                weekly: {},
                yearly: {},
              },
            };
          }
    
          // Update analysis
          const analysis = responseData[`${transactionName}(${txName})`].analysis;
          analysis.total += 1;
          analysis.totalReceived += receives.length;
          analysis.totalSent += sends.length;
    
          const transactionDate = new Date(transaction.time_at * 1000);
          const monthKey = `${transactionDate.getFullYear()}-${transactionDate.getMonth() + 1}`;
          const weekKey = `Week ${getWeekOfMonth(transactionDate)} of ${(transactionDate, 'MMMM')} ${transactionDate.getFullYear()}`;
          const yearKey = `${transactionDate.getFullYear()}`;
    
          analysis.monthly[monthKey] = analysis.monthly[monthKey] || { total: 0, totalAmountUSDSent: 0, totalAmountUSDReceived: 0 };
          analysis.monthly[monthKey].total += 1;
          analysis.monthly[monthKey].totalAmountUSDSent += getSendsTotalAmountUSD(sends, tokenDict);
          analysis.monthly[monthKey].totalAmountUSDReceived += getReceivesTotalAmountUSD(receives, tokenDict);
    
          analysis.weekly[weekKey] = analysis.weekly[weekKey] || { total: 0, totalAmountUSDSent: 0, totalAmountUSDReceived: 0 };
          analysis.weekly[weekKey].total += 1;
          analysis.weekly[weekKey].totalAmountUSDSent += getSendsTotalAmountUSD(sends, tokenDict);
          analysis.weekly[weekKey].totalAmountUSDReceived += getReceivesTotalAmountUSD(receives, tokenDict);
    
          analysis.yearly[yearKey] = analysis.yearly[yearKey] || { total: 0, totalAmountUSDSent: 0, totalAmountUSDReceived: 0 };
          analysis.yearly[yearKey].total += 1;
          analysis.yearly[yearKey].totalAmountUSDSent += getSendsTotalAmountUSD(sends, tokenDict);
          analysis.yearly[yearKey].totalAmountUSDReceived += getReceivesTotalAmountUSD(receives, tokenDict);
    
          // Calculate total amount in USD
          analysis.totalAmountUSDReceived += getReceivesTotalAmountUSD(receives, tokenDict);
          analysis.totalAmountUSDSent += getSendsTotalAmountUSD(sends, tokenDict);

          // Add row to transactions array
          responseData[`${transactionName}(${txName})`].transactions.push(row);

        });
    
        const barGraphData = createBarGraphData(responseData);

        //Get Sends and Receives data of Swap transaction((execute)) Chart
        const transactions = responseData['swap transaction((execute))'].transactions
      
        // Get value of Sends data
        const listOfSendsData = []
        const sendsData = transactions.map(item =>item.sends)
        sendsData.forEach(item =>{
         const getSendsData = Object.values(item)
         //console.log(getSendsData)
         listOfSendsData.push(getSendsData.map(row =>row.value))
        })

        //Get value of Receives data
        const listOfReceivesData = []
        const receivesData = transactions.map(item =>item.receives)
        receivesData.forEach(item =>{
         const getSendsData = Object.values(item)
         //console.log(getSendsData)
         listOfReceivesData.push(getSendsData.map(row =>row.value))
        })

      // Swap transaction((execute)) Chart
       new Chart(
        document.getElementById('SwapTransaction(execute)'),
        {
          type: 'bar',
          data: {
            labels: ['1','2','3','4','5','6','7'],
            datasets: [
              {
                label: 'swap transaction((execute)) - Sends',
                data: listOfSendsData
               
              },
              {
                label: 'swap transaction((execute)) - Receives',
                data:  listOfReceivesData
               
              }

            ]
          }
        }
      );

      } catch (error) {
        console.error('Error fetching data:', error); 
      }

    // Function to create bar graph data
    function createBarGraphData(responseData) {
      const barGraphData = {
        monthly: {},
        weekly: {},
        yearly: {},
      };
    
      Object.keys(responseData).forEach(key => {
        const analysis = responseData[key].analysis;
    
        // Monthly
        Object.keys(analysis.monthly).forEach(monthKey => {
          if (!barGraphData.monthly[monthKey]) {
            barGraphData.monthly[monthKey] = {};
          }
          barGraphData.monthly[monthKey][key] = {
            sends: analysis.monthly[monthKey].totalAmountUSDSent,
            receives: analysis.monthly[monthKey].totalAmountUSDReceived,
          };
        });
    
        // Weekly
        Object.keys(analysis.weekly).forEach(weekKey => {
          if (!barGraphData.weekly[weekKey]) {
            barGraphData.weekly[weekKey] = {};
          }
          barGraphData.weekly[weekKey][key] = {
            sends: analysis.weekly[weekKey].totalAmountUSDSent,
            receives: analysis.weekly[weekKey].totalAmountUSDReceived,
          };
        });
    
        // Yearly
        Object.keys(analysis.yearly).forEach(yearKey => {
          if (!barGraphData.yearly[yearKey]) {
            barGraphData.yearly[yearKey] = {};
          }
          barGraphData.yearly[yearKey][key] = {
            sends: analysis.yearly[yearKey].totalAmountUSDSent,
            receives: analysis.yearly[yearKey].totalAmountUSDReceived,
          };
        });
      });
      
    }
    
    
    
    
    // Function to get the week number of the month
    function getWeekOfMonth(date) {
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const diff = date.getDate() + firstDay.getDay() - 1;
      return Math.ceil(diff / 7);
    }
    
    // Function to get the total amount in USD for sends
    function getSendsTotalAmountUSD(sends, tokenDict) {
      return sends.reduce((total, send) => {
        const tokenInfo = tokenDict[send.token_id] || {};
        return total + send.amount * (tokenInfo.price || 0);
      }, 0);
    }
    
    // Function to get the total amount in USD for receives
    function getReceivesTotalAmountUSD(receives, tokenDict) {
      return receives.reduce((total, receive) => {
        const tokenInfo = tokenDict[receive.token_id] || {};
        return total + receive.amount * (tokenInfo.price || 0);
      }, 0);
    }
    
}

dataChart()


