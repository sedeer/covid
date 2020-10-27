#!/usr/bin/python

import pandas as pd

# Confirmed cases
df = pd.read_csv('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv')
df['Country/Region'].loc[df['Province/State'] == 'Hong Kong'] = "Hong Kong"

counts_df=df.drop(columns=["Province/State","Lat","Long"]).groupby(['Country/Region']).sum().transpose()
counts_df.rename(columns={'US':'United States', 'Congo (Brazzaville)':'Congo','Congo (Kinshasa)':'Dem. Rep. Congo','Korea, South':'Korea','Taiwan*':'Taiwan','occupied Palestinian territory':'Palestine','Czechia':'Czech Rep.'}, inplace=True)
counts_df.reset_index(inplace=True)
counts_df=pd.melt(counts_df, id_vars=['index'], value_vars=counts_df.keys()[1:])
counts_df.rename(columns={'index':'date','Country/Region':'country','value':'count'}, inplace=True)

# Deaths
df = pd.read_csv('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv')
df['Country/Region'].loc[df['Province/State'] == 'Hong Kong'] = "Hong Kong"

deaths_df=df.drop(columns=["Province/State","Lat","Long"]).groupby(['Country/Region']).sum().transpose()
deaths_df.rename(columns={'US':'United States', 'Congo (Brazzaville)':'Congo','Congo (Kinshasa)':'Dem. Rep. Congo','Korea, South':'Korea','Taiwan*':'Taiwan','occupied Palestinian territory':'Palestine','Czechia':'Czech Rep.'}, inplace=True)
deaths_df.reset_index(inplace=True)
deaths_df=pd.melt(deaths_df, id_vars=['index'], value_vars=deaths_df.keys()[1:])
counts_df["deaths"] = deaths_df.value.tolist()

# Calculate days since case 100
counts_df["days100"]=counts_df['count'].ge(100).groupby(counts_df['country']).cumsum().astype(int)-1

# Get population data
pops = pd.read_csv("populations.csv")
counts_df = pd.merge(counts_df, pops, on="country", how="left")
counts_df["count_100k"] = counts_df["count"].mul(100000).div(counts_df["population"]).round(4)
counts_df["deaths_100k"] = counts_df["deaths"].mul(100000).div(counts_df["population"]).round(4)

pd.set_option('use_inf_as_na', True) # don't want inf showing up when we calculate percentages
# Calculate change since previous day
counts_df['count_change']=counts_df['count'].groupby(counts_df['country']).diff()
counts_df['count_change_100k']= counts_df["count_change"].mul(100000).div(counts_df["population"]).round(4)
counts_df['count_change_avg']=counts_df['count_change'].rolling(4).mean()
counts_df['count_change_avg_100k']= counts_df["count_change_avg"].mul(100000).div(counts_df["population"]).round(4)
counts_df['deaths_change']=counts_df['deaths'].groupby(counts_df['country']).diff()
counts_df['death_change_100k']= counts_df["deaths_change"].mul(100000).div(counts_df["population"]).round(4)
counts_df['deaths_change_avg']=counts_df['deaths_change'].rolling(4).mean()
counts_df['death_change_avg_100k']= counts_df["deaths_change_avg"].mul(100000).div(counts_df["population"]).round(4)

# Calculate percent changes
counts_df['count_pct']=counts_df['count_change'].groupby(counts_df['country']).pct_change()*100
#counts_df['count_pct4']=counts_df['count_change'].groupby(counts_df['country']).pct_change(4)*100
#counts_df['count_pct2']=counts_df['count'].groupby(counts_df['country']).pct_change(2)*100
counts_df['count_pct4']=counts_df['count_pct'].rolling(7).mean()
counts_df['deaths_pct']=counts_df['deaths_change'].groupby(counts_df['country']).pct_change()*100
#counts_df['deaths_pct4']=counts_df['deaths_change'].groupby(counts_df['country']).pct_change(4)*100
#counts_df['deaths_pct2']=counts_df['deaths'].groupby(counts_df['country']).pct_change(2)*100
counts_df['deaths_pct4']=counts_df['deaths_pct'].rolling(7).mean()
counts_df.fillna(0, inplace=True)
counts_df['count_pct'] = counts_df['count_pct'].map(lambda x: '%2.2f' % x)
#counts_df['count_pct2'] = counts_df['count_pct2'].map(lambda x: '%2.2f' % x)
counts_df['count_pct4'] = counts_df['count_pct4'].map(lambda x: '%2.2f' % x)
counts_df['deaths_pct'] = counts_df['deaths_pct'].map(lambda x: '%2.2f' % x)
#counts_df['deaths_pct2'] = counts_df['deaths_pct2'].map(lambda x: '%2.2f' % x)
counts_df['deaths_pct4'] = counts_df['deaths_pct4'].map(lambda x: '%2.2f' % x)

counts_df.to_csv("confirmed-and-dead.csv",index=False)
