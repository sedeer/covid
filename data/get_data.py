#!/usr/bin/python

import pandas as pd

pd.set_option('use_inf_as_na', True) # don't want inf showing up when we calculate percentages

# Confirmed cases
df = pd.read_csv('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv')

counts_df=df.drop(columns=["Province/State","Lat","Long"]).groupby(['Country/Region']).sum().transpose()
counts_df.rename(columns={'US':'United States', 'Congo (Brazzaville)':'Congo','Congo (Kinshasa)':'Dem. Rep. Congo','Korea, South':'Korea','Taiwan*':'Taiwan','occupied Palestinian territory':'Palestine','Czechia':'Czech Rep.'}, inplace=True)
counts_df.reset_index(inplace=True)
counts_df=pd.melt(counts_df, id_vars=['index'], value_vars=counts_df.keys()[1:])
counts_df.rename(columns={'index':'date','Country/Region':'country','value':'count'}, inplace=True)


# Deaths
df = pd.read_csv('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv')

deaths_df=df.drop(columns=["Province/State","Lat","Long"]).groupby(['Country/Region']).sum().transpose()
deaths_df.rename(columns={'US':'United States', 'Congo (Brazzaville)':'Congo','Congo (Kinshasa)':'Dem. Rep. Congo','Korea, South':'Korea','Taiwan*':'Taiwan','occupied Palestinian territory':'Palestine','Czechia':'Czech Rep.'}, inplace=True)
deaths_df.reset_index(inplace=True)
deaths_df=pd.melt(deaths_df, id_vars=['index'], value_vars=deaths_df.keys()[1:])
counts_df["deaths"] = deaths_df.value.tolist()

# Calculate days since case 100
counts_df["days100"]=counts_df['count'].ge(100).groupby(counts_df['country']).cumsum().astype(int)-1

# Calculate percent changes
counts_df['count_pct']=counts_df['count'].groupby(counts_df['country']).pct_change()*100
counts_df['count_pct2']=counts_df['count'].groupby(counts_df['country']).pct_change(2)*100
counts_df['deaths_pct']=counts_df['deaths'].groupby(counts_df['country']).pct_change()*100
counts_df['deaths_pct2']=counts_df['deaths'].groupby(counts_df['country']).pct_change(2)*100
counts_df.fillna(0, inplace=True)
counts_df['count_pct'] = counts_df['count_pct'].map(lambda x: '%2.2f' % x)
counts_df['count_pct2'] = counts_df['count_pct2'].map(lambda x: '%2.2f' % x)
counts_df['deaths_pct'] = counts_df['deaths_pct'].map(lambda x: '%2.2f' % x)
counts_df['deaths_pct2'] = counts_df['deaths_pct2'].map(lambda x: '%2.2f' % x)

counts_df.to_csv("confirmed-and-dead.csv",index=False)
